"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const ESC = String.fromCharCode(27);
const colors = {
    red: `${ESC}[31m`,
    green: `${ESC}[32m`,
    yellow: `${ESC}[33m`,
    blue: `${ESC}[34m`,
    white: `${ESC}[37m`,
    cyan: `${ESC}[36m`
};
const styles = {
    reset: `${ESC}[0m`,
    bold: `${ESC}[1m`
};
const ANSI = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
const levels = {
    info: { label: 'INFO', color: colors.white, method: 'info' },
    warn: { label: 'WARN', color: colors.yellow, method: 'warn' },
    error: { label: 'ERROR', color: colors.red, method: 'error' },
    trace: { label: 'TRACE', color: colors.blue, method: 'log', stack: true },
    debug: { label: 'DEBUG', color: colors.cyan, method: 'debug', gated: true },
    success: { label: 'SUCCESS', color: colors.green, method: 'log' }
};
const isNode = () => typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
let nodeModules;
/**
 * Loaded on first use rather than imported, so a browser bundle never has to
 * resolve 'fs'. package.json also maps 'fs' and 'path' to false for bundlers.
 */
function loadNodeModules() {
    if (nodeModules === undefined) {
        nodeModules = null;
        try {
            const fs = require('fs');
            const path = require('path');
            if (typeof fs.openSync === 'function' && typeof path.join === 'function') {
                nodeModules = { fs: fs, path: path };
            }
        }
        catch (error) {
            nodeModules = null;
        }
    }
    return nodeModules;
}
const pad = (num) => String(num).padStart(2, '0');
/** Local calendar date, so file names line up with the timestamps inside them. */
function localDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function localTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function className(value) {
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
function stringify(value, seen) {
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
            return `[${value.map((item) => stringify(item, seen)).join(',')}]`;
        }
        if (value instanceof Map) {
            const entries = [];
            value.forEach((val, key) => {
                entries.push(`${stringify(key, seen)}:${stringify(val, seen)}`);
            });
            return `Map(${value.size}) {${entries.join(',')}}`;
        }
        if (value instanceof Set) {
            const items = [];
            value.forEach((item) => {
                items.push(stringify(item, seen));
            });
            return `Set(${value.size}) [${items.join(',')}]`;
        }
        const props = Object.keys(value).map((key) => {
            let serialized;
            try {
                serialized = stringify(value[key], seen);
            }
            catch (error) {
                serialized = '"[Throws]"';
            }
            return `${JSON.stringify(key)}:${serialized}`;
        });
        return `${className(value)}{${props.join(',')}}`;
    }
    finally {
        seen.pop();
    }
}
/** Top-level arguments: strings and Errors print bare, everything else serialized. */
function formatArg(value) {
    try {
        if (typeof value === 'string') {
            return value;
        }
        if (value instanceof Error) {
            return value.stack || `${value.name}: ${value.message}`;
        }
        return stringify(value, []);
    }
    catch (error) {
        return '[Unserializable]';
    }
}
/**
 * The caller's stack, without the frames inside this module. Error.captureStackTrace
 * is V8-only, so other engines keep the few extra frames rather than crash.
 */
function captureFrames(boundary) {
    const error = new Error();
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(error, boundary);
    }
    const stack = error.stack || '';
    const lines = stack.split('\n').filter((line) => /^\s+at\s/.test(line));
    return lines.length > 0 ? lines.join('\n') : stack.split('\n').slice(1).join('\n');
}
const buffering = [];
let exitHookInstalled = false;
/**
 * One process-wide 'exit' listener drains every logger that still has buffered
 * lines, rather than one listener per instance.
 */
function trackBuffering(logger) {
    if (buffering.indexOf(logger) === -1) {
        buffering.push(logger);
    }
    if (exitHookInstalled || typeof process === 'undefined' || typeof process.once !== 'function') {
        return;
    }
    exitHookInstalled = true;
    process.once('exit', () => {
        buffering.slice().forEach((pending) => pending.flush());
    });
}
function untrackBuffering(logger) {
    const index = buffering.indexOf(logger);
    if (index !== -1) {
        buffering.splice(index, 1);
    }
}
class Logger {
    constructor(options) {
        this.queue = [];
        this.writing = false;
        this.writeErrorReported = false;
        const node = isNode();
        this.canWriteFiles = node;
        this.useColor = typeof (options === null || options === void 0 ? void 0 : options.useColor) === 'boolean' ? options.useColor : node;
        this.logInFile = typeof (options === null || options === void 0 ? void 0 : options.logInFile) === 'boolean' ? options.logInFile : true;
        this.logLevel = typeof (options === null || options === void 0 ? void 0 : options.logLevel) === 'string' ? options.logLevel : 'prod';
        this.baseFileName = typeof (options === null || options === void 0 ? void 0 : options.fileName) === 'string' && options.fileName.trim() !== ''
            ? options.fileName
            : 'logger.log';
    }
    info(...msg) {
        this.emit(levels.info, msg);
    }
    warn(...msg) {
        this.emit(levels.warn, msg);
    }
    trace(...msg) {
        this.emit(levels.trace, msg, this.trace);
    }
    error(...msg) {
        this.emit(levels.error, msg);
    }
    debug(...msg) {
        this.emit(levels.debug, msg);
    }
    success(...msg) {
        this.emit(levels.success, msg);
    }
    /** Writes any buffered lines to disk immediately. */
    flush() {
        this.drain(true);
    }
    emit(level, msg, boundary) {
        if (level.gated && this.logLevel !== 'debug') {
            return;
        }
        const body = msg.map(formatArg).join(' ');
        let line = body ? `${this.header(level)} ${body}` : this.header(level);
        if (level.stack) {
            const frames = captureFrames(boundary || this.emit);
            if (frames) {
                line += `\n${frames}`;
            }
        }
        console[level.method](line);
        this.writeToFile(line);
    }
    header(level) {
        const date = new Date();
        const time = `[${localDate(date)} ${localTime(date)}]`;
        return this.useColor
            ? `${styles.reset}${styles.bold}${level.color}${time} ${level.label}:${styles.reset}`
            : `${time} ${level.label}:`;
    }
    writeToFile(line) {
        if (!this.logInFile || !this.canWriteFiles) {
            return;
        }
        this.queue.push(`${line.replace(ANSI, '')}\n`);
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
        trackBuffering(this);
        this.flushTimer = setTimeout(() => {
            this.flushTimer = undefined;
            this.drain(false);
        }, 0);
        if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
            this.flushTimer.unref();
        }
    }
    drain(sync) {
        const modules = loadNodeModules();
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
            untrackBuffering(this);
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
        const stamp = localDate(new Date());
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
        console.error(`${this.header(levels.error)} logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLEdBQUcsR0FBVyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRTVDLE1BQU0sTUFBTSxHQUFHO0lBQ1gsR0FBRyxFQUFFLEdBQUcsR0FBRyxNQUFNO0lBQ2pCLEtBQUssRUFBRSxHQUFHLEdBQUcsTUFBTTtJQUNuQixNQUFNLEVBQUUsR0FBRyxHQUFHLE1BQU07SUFDcEIsSUFBSSxFQUFFLEdBQUcsR0FBRyxNQUFNO0lBQ2xCLEtBQUssRUFBRSxHQUFHLEdBQUcsTUFBTTtJQUNuQixJQUFJLEVBQUUsR0FBRyxHQUFHLE1BQU07Q0FDckIsQ0FBQztBQUVGLE1BQU0sTUFBTSxHQUFHO0lBQ1gsS0FBSyxFQUFFLEdBQUcsR0FBRyxLQUFLO0lBQ2xCLElBQUksRUFBRSxHQUFHLEdBQUcsS0FBSztDQUNwQixDQUFDO0FBRUYsTUFBTSxJQUFJLEdBQVcsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztBQWMxRCxNQUFNLE1BQU0sR0FBK0I7SUFDdkMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFO0lBQzVELElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRTtJQUM3RCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUU7SUFDN0QsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFN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