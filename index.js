"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Everything Logger needs but does not expose. Members are static rather than
 * per-instance because the state here - the module cache and the buffering
 * registry - is process-wide by design, shared by every Logger.
 *
 * Methods never read 'this': Helper.formatArg is passed unbound to Array.map,
 * so every internal reference is qualified with Helper instead.
 */
class Helper {
    static isNode() {
        return typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
    }
    /**
     * Loaded on first use rather than imported, so a browser bundle never has to
     * resolve 'fs'. package.json also maps 'fs' and 'path' to false for bundlers.
     */
    static loadNodeModules() {
        if (Helper.nodeModules === undefined) {
            Helper.nodeModules = null;
            try {
                const fs = require('fs');
                const path = require('path');
                if (typeof fs.openSync === 'function' && typeof path.join === 'function') {
                    Helper.nodeModules = { fs: fs, path: path };
                }
            }
            catch (error) {
                Helper.nodeModules = null;
            }
        }
        return Helper.nodeModules;
    }
    static pad(num) {
        return String(num).padStart(2, '0');
    }
    /** Local calendar date, so file names line up with the timestamps inside them. */
    static localDate(date) {
        return `${date.getFullYear()}-${Helper.pad(date.getMonth() + 1)}-${Helper.pad(date.getDate())}`;
    }
    static localTime(date) {
        return `${Helper.pad(date.getHours())}:${Helper.pad(date.getMinutes())}:${Helper.pad(date.getSeconds())}`;
    }
    static className(value) {
        const proto = Object.getPrototypeOf(value);
        if (!proto || proto === Object.prototype) {
            return '';
        }
        const name = proto.constructor && proto.constructor.name;
        return name && name !== 'Object' ? `${name} ` : '';
    }
    /**
     * Serializes a value in full, whatever it is: no depth limit, cycles become
     * "[Circular]", and BigInt, symbols, functions and Errors all survive.
     */
    static stringify(value, seen) {
        if (value === null) {
            return 'null';
        }
        switch (typeof value) {
            case 'string': return JSON.stringify(value);
            case 'number': return Object.is(value, -0) ? '-0' : String(value);
            case 'boolean': return String(value);
            case 'undefined': return 'undefined';
            case 'bigint': return `${value}n`;
            case 'symbol': return value.toString();
            case 'function': return `[Function: ${value.name || 'anonymous'}]`;
        }
        if (seen.indexOf(value) !== -1) {
            return '"[Circular]"';
        }
        seen.push(value);
        try {
            if (value instanceof Error) {
                return JSON.stringify(value.stack || `${value.name}: ${value.message}`);
            }
            if (value instanceof Date) {
                return JSON.stringify(isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString());
            }
            if (value instanceof RegExp) {
                return JSON.stringify(String(value));
            }
            if (Array.isArray(value)) {
                return `[${value.map((item) => Helper.stringify(item, seen)).join(',')}]`;
            }
            if (value instanceof Map) {
                const entries = [];
                value.forEach((val, key) => {
                    entries.push(`${Helper.stringify(key, seen)}:${Helper.stringify(val, seen)}`);
                });
                return `Map(${value.size}) {${entries.join(',')}}`;
            }
            if (value instanceof Set) {
                const items = [];
                value.forEach((item) => {
                    items.push(Helper.stringify(item, seen));
                });
                return `Set(${value.size}) [${items.join(',')}]`;
            }
            const props = Object.keys(value).map((key) => {
                let serialized;
                try {
                    serialized = Helper.stringify(value[key], seen);
                }
                catch (error) {
                    serialized = '"[Throws]"';
                }
                return `${JSON.stringify(key)}:${serialized}`;
            });
            return `${Helper.className(value)}{${props.join(',')}}`;
        }
        finally {
            seen.pop();
        }
    }
    /** Top-level arguments: strings and Errors print bare, everything else serialized. */
    static formatArg(value) {
        try {
            if (typeof value === 'string') {
                return value;
            }
            if (value instanceof Error) {
                return value.stack || `${value.name}: ${value.message}`;
            }
            return Helper.stringify(value, []);
        }
        catch (error) {
            return '[Unserializable]';
        }
    }
    /**
     * The caller's stack, without the frames inside this module. Error.captureStackTrace
     * is V8-only, so other engines keep the few extra frames rather than crash.
     */
    static captureFrames(boundary) {
        const error = new Error();
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(error, boundary);
        }
        const stack = error.stack || '';
        const lines = stack.split('\n').filter((line) => /^\s+at\s/.test(line));
        return lines.length > 0 ? lines.join('\n') : stack.split('\n').slice(1).join('\n');
    }
    /**
     * One process-wide 'exit' listener drains every logger that still has buffered
     * lines, rather than one listener per instance.
     */
    static trackBuffering(logger) {
        if (Helper.buffering.indexOf(logger) === -1) {
            Helper.buffering.push(logger);
        }
        if (Helper.exitHookInstalled || typeof process === 'undefined' || typeof process.once !== 'function') {
            return;
        }
        Helper.exitHookInstalled = true;
        process.once('exit', () => {
            Helper.buffering.slice().forEach((pending) => pending.flush());
        });
    }
    static untrackBuffering(logger) {
        const index = Helper.buffering.indexOf(logger);
        if (index !== -1) {
            Helper.buffering.splice(index, 1);
        }
    }
}
Helper.ESC = String.fromCharCode(27);
Helper.colors = {
    red: `${Helper.ESC}[31m`,
    green: `${Helper.ESC}[32m`,
    yellow: `${Helper.ESC}[33m`,
    blue: `${Helper.ESC}[34m`,
    white: `${Helper.ESC}[37m`,
    cyan: `${Helper.ESC}[36m`
};
Helper.styles = {
    reset: `${Helper.ESC}[0m`,
    bold: `${Helper.ESC}[1m`
};
Helper.ANSI = new RegExp(`${Helper.ESC}\\[[0-9;]*m`, 'g');
Helper.levels = {
    info: { label: 'INFO', color: Helper.colors.white, method: 'info' },
    warn: { label: 'WARN', color: Helper.colors.yellow, method: 'warn' },
    error: { label: 'ERROR', color: Helper.colors.red, method: 'error' },
    trace: { label: 'TRACE', color: Helper.colors.blue, method: 'log', stack: true },
    debug: { label: 'DEBUG', color: Helper.colors.cyan, method: 'debug', gated: true },
    success: { label: 'SUCCESS', color: Helper.colors.green, method: 'log' }
};
Helper.buffering = [];
Helper.exitHookInstalled = false;
class Logger {
    constructor(options) {
        this.queue = [];
        this.writing = false;
        this.writeErrorReported = false;
        const node = Helper.isNode();
        this.canWriteFiles = node;
        this.useColor = typeof (options === null || options === void 0 ? void 0 : options.useColor) === 'boolean' ? options.useColor : node;
        this.logInFile = typeof (options === null || options === void 0 ? void 0 : options.logInFile) === 'boolean' ? options.logInFile : true;
        this.logLevel = typeof (options === null || options === void 0 ? void 0 : options.logLevel) === 'string' ? options.logLevel : 'prod';
        this.baseFileName = typeof (options === null || options === void 0 ? void 0 : options.fileName) === 'string' && options.fileName.trim() !== ''
            ? options.fileName
            : 'logger.log';
    }
    info(...msg) {
        this.emit(Helper.levels.info, msg);
    }
    warn(...msg) {
        this.emit(Helper.levels.warn, msg);
    }
    trace(...msg) {
        this.emit(Helper.levels.trace, msg, this.trace);
    }
    error(...msg) {
        this.emit(Helper.levels.error, msg);
    }
    debug(...msg) {
        this.emit(Helper.levels.debug, msg);
    }
    success(...msg) {
        this.emit(Helper.levels.success, msg);
    }
    /** Writes any buffered lines to disk immediately. */
    flush() {
        this.drain(true);
    }
    emit(level, msg, boundary) {
        if (level.gated && this.logLevel !== 'debug') {
            return;
        }
        const body = msg.map(Helper.formatArg).join(' ');
        let line = body ? `${this.header(level)} ${body}` : this.header(level);
        if (level.stack) {
            const frames = Helper.captureFrames(boundary || this.emit);
            if (frames) {
                line += `\n${frames}`;
            }
        }
        console[level.method](line);
        this.writeToFile(line);
    }
    header(level) {
        const date = new Date();
        const time = `[${Helper.localDate(date)} ${Helper.localTime(date)}]`;
        return this.useColor
            ? `${Helper.styles.reset}${Helper.styles.bold}${level.color}${time} ${level.label}:${Helper.styles.reset}`
            : `${time} ${level.label}:`;
    }
    writeToFile(line) {
        if (!this.logInFile || !this.canWriteFiles) {
            return;
        }
        this.queue.push(`${line.replace(Helper.ANSI, '')}\n`);
        this.scheduleDrain();
    }
    /**
     * Batches lines instead of opening, writing and closing the file per call.
     * The timer is unref'd, so a process that is otherwise done exits at once
     * and the 'exit' hook flushes what is left synchronously.
     */
    scheduleDrain() {
        if (this.flushTimer !== undefined) {
            return;
        }
        Helper.trackBuffering(this);
        this.flushTimer = setTimeout(() => {
            this.flushTimer = undefined;
            this.drain(false);
        }, 0);
        if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
            this.flushTimer.unref();
        }
    }
    drain(sync) {
        const modules = Helper.loadNodeModules();
        if (!modules || this.queue.length === 0 || (this.writing && !sync)) {
            return;
        }
        const data = this.queue.join('');
        this.queue.length = 0;
        try {
            const fd = this.openFile(modules);
            if (sync) {
                modules.fs.writeSync(fd, data);
                this.writeErrorReported = false;
                this.settle();
                return;
            }
            this.writing = true;
            modules.fs.write(fd, data, (error) => {
                this.writing = false;
                if (error) {
                    this.reportWriteError(error);
                }
                else {
                    this.writeErrorReported = false;
                }
                this.drain(false);
                this.settle();
            });
        }
        catch (error) {
            this.writing = false;
            this.reportWriteError(error);
            this.settle();
        }
    }
    settle() {
        if (this.queue.length === 0 && !this.writing && this.flushTimer === undefined) {
            Helper.untrackBuffering(this);
        }
    }
    /**
     * Keeps one appending descriptor open, reopening only when the resolved
     * path changes - which happens when the local date rolls over.
     */
    openFile(modules) {
        const target = this.filePath(modules);
        if (this.fd !== undefined && this.fdPath === target) {
            return this.fd;
        }
        if (this.fd !== undefined) {
            try {
                modules.fs.closeSync(this.fd);
            }
            catch (error) {
                // The descriptor is being replaced either way.
            }
            this.fd = undefined;
        }
        const dir = modules.path.dirname(target);
        if (dir && dir !== '.') {
            modules.fs.mkdirSync(dir, { recursive: true });
        }
        this.fd = modules.fs.openSync(target, 'a');
        this.fdPath = target;
        return this.fd;
    }
    /** Date-stamps the file name, leaving any directory in fileName intact. */
    filePath(modules) {
        const stamp = Helper.localDate(new Date());
        const dir = modules.path.dirname(this.baseFileName);
        const base = modules.path.basename(this.baseFileName);
        return modules.path.join(dir, `${stamp}-${base}`);
    }
    /** Reported once per failure streak, so a bad path cannot flood the console. */
    reportWriteError(error) {
        if (this.writeErrorReported) {
            return;
        }
        this.writeErrorReported = true;
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`${this.header(Helper.levels.error)} logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUEyQkE7Ozs7Ozs7R0FPRztBQUNILE1BQU0sTUFBTTtJQW1DRCxNQUFNLENBQUMsTUFBTTtRQUNoQixPQUFPLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDM0YsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxlQUFlO1FBQ3pCLElBQUksTUFBTSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7WUFDbEMsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSTtnQkFDQSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFN0IsSUFBSSxPQUFPLEVBQUUsQ0FBQyxRQUFRLEtBQUssVUFBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7b0JBQ3RFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztpQkFDL0M7YUFDSjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNaLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO2FBQzdCO1NBQ0o7UUFFRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUM7SUFDOUIsQ0FBQztJQUVPLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBVztRQUMxQixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxrRkFBa0Y7SUFDM0UsTUFBTSxDQUFDLFNB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