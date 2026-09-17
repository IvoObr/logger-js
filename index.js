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
        return (typeof process !== 'undefined' &&
            !!process.versions &&
            !!process.versions.node);
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
                if (typeof fs.openSync === 'function' &&
                    typeof path.join === 'function') {
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
            case 'string':
                return JSON.stringify(value);
            case 'number':
                return Object.is(value, -0) ? '-0' : String(value);
            case 'boolean':
                return String(value);
            case 'undefined':
                return 'undefined';
            case 'bigint':
                return `${value}n`;
            case 'symbol':
                return value.toString();
            case 'function':
                return `[Function: ${value.name || 'anonymous'}]`;
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
                return JSON.stringify(isNaN(value.getTime())
                    ? 'Invalid Date'
                    : value.toISOString());
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
    /** JSON has no -0, and no representation at all for NaN or Infinity. */
    static jsonNumber(value) {
        if (Object.is(value, -0)) {
            return 0;
        }
        return isFinite(value) ? value : String(value);
    }
    /**
     * The sibling of stringify that yields a JSON-safe *value* rather than a
     * display string, with the same guarantees: no depth limit, cycles become
     * "[Circular]", getters that throw become "[Throws]". Every type JSON cannot
     * carry gets a documented stand-in, so nothing silently becomes null.
     */
    static jsonValue(value, seen) {
        if (value === null) {
            return null;
        }
        switch (typeof value) {
            case 'string':
                return value;
            case 'boolean':
                return value;
            case 'number':
                return Helper.jsonNumber(value);
            case 'undefined':
                return '[undefined]';
            case 'bigint':
                return `${value}n`;
            case 'symbol':
                return value.toString();
            case 'function':
                return `[Function: ${value.name || 'anonymous'}]`;
        }
        if (seen.indexOf(value) !== -1) {
            return '[Circular]';
        }
        seen.push(value);
        try {
            if (value instanceof Error) {
                return {
                    type: value.name,
                    message: value.message,
                    stack: value.stack || `${value.name}: ${value.message}`,
                };
            }
            if (value instanceof Date) {
                return isNaN(value.getTime())
                    ? 'Invalid Date'
                    : value.toISOString();
            }
            if (value instanceof RegExp) {
                return String(value);
            }
            if (Array.isArray(value)) {
                return value.map((item) => Helper.jsonValue(item, seen));
            }
            if (value instanceof Map) {
                const entries = [];
                value.forEach((val, key) => {
                    entries.push([
                        Helper.jsonValue(key, seen),
                        Helper.jsonValue(val, seen),
                    ]);
                });
                return { __type: 'Map', entries: entries };
            }
            if (value instanceof Set) {
                const values = [];
                value.forEach((item) => {
                    values.push(Helper.jsonValue(item, seen));
                });
                return { __type: 'Set', values: values };
            }
            // Own enumerable keys only, and no class name: a query language has
            // nowhere to put one, and the keys are what is worth indexing.
            const plain = {};
            Object.keys(value).forEach((key) => {
                try {
                    plain[key] = Helper.jsonValue(value[key], seen);
                }
                catch (error) {
                    plain[key] = '[Throws]';
                }
            });
            return plain;
        }
        finally {
            seen.pop();
        }
    }
    /** One top-level argument, with the same never-throws promise as formatArg. */
    static jsonArg(value) {
        try {
            return Helper.jsonValue(value, []);
        }
        catch (error) {
            return '[Unserializable]';
        }
    }
    /**
     * Only text lines are ever coloured, so the regex is skipped unless an escape
     * is actually there - which also keeps a JSON payload's own bytes intact.
     */
    static stripColor(line) {
        return line.indexOf(Helper.ESC) === -1
            ? line
            : line.replace(Helper.ANSI, '');
    }
    /** Anything that is not one of the two modes falls back, as the other options do. */
    static outputMode(value, fallback) {
        return value === 'text' || value === 'json' ? value : fallback;
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
        const lines = stack
            .split('\n')
            .filter((line) => /^\s+at\s/.test(line));
        return lines.length > 0
            ? lines.join('\n')
            : stack.split('\n').slice(1).join('\n');
    }
    /**
     * One process-wide 'exit' listener drains every logger that still has buffered
     * lines, rather than one listener per instance.
     */
    static trackBuffering(logger) {
        if (Helper.buffering.indexOf(logger) === -1) {
            Helper.buffering.push(logger);
        }
        if (Helper.exitHookInstalled ||
            typeof process === 'undefined' ||
            typeof process.once !== 'function') {
            return;
        }
        Helper.exitHookInstalled = true;
        process.once('exit', () => {
            Helper.buffering
                .slice()
                .forEach((pending) => pending.flush());
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
    cyan: `${Helper.ESC}[36m`,
};
Helper.styles = {
    reset: `${Helper.ESC}[0m`,
    bold: `${Helper.ESC}[1m`,
};
Helper.ANSI = new RegExp(`${Helper.ESC}\\[[0-9;]*m`, 'g');
Helper.levels = {
    info: {
        name: 'info',
        label: 'INFO',
        color: Helper.colors.white,
        method: 'info',
    },
    warn: {
        name: 'warn',
        label: 'WARN',
        color: Helper.colors.yellow,
        method: 'warn',
    },
    error: {
        name: 'error',
        label: 'ERROR',
        color: Helper.colors.red,
        method: 'error',
    },
    trace: {
        name: 'trace',
        label: 'TRACE',
        color: Helper.colors.blue,
        method: 'log',
        stack: true,
    },
    debug: {
        name: 'debug',
        label: 'DEBUG',
        color: Helper.colors.cyan,
        method: 'debug',
        gated: true,
    },
    success: {
        name: 'success',
        label: 'SUCCESS',
        color: Helper.colors.green,
        method: 'log',
    },
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
        this.useColor =
            typeof (options === null || options === void 0 ? void 0 : options.useColor) === 'boolean' ? options.useColor : node;
        this.logInFile =
            typeof (options === null || options === void 0 ? void 0 : options.logInFile) === 'boolean' ? options.logInFile : true;
        this.logLevel =
            typeof (options === null || options === void 0 ? void 0 : options.logLevel) === 'string' ? options.logLevel : 'prod';
        this.baseFileName =
            typeof (options === null || options === void 0 ? void 0 : options.fileName) === 'string' &&
                options.fileName.trim() !== ''
                ? options.fileName
                : 'logger.log';
        this.output = Helper.outputMode(options === null || options === void 0 ? void 0 : options.output, 'text');
        this.fileOutput = Helper.outputMode(options === null || options === void 0 ? void 0 : options.fileOutput, this.output);
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
        const record = {
            level: level,
            date: new Date(),
            args: msg,
            frames: level.stack
                ? Helper.captureFrames(boundary || this.emit)
                : '',
        };
        const line = this.render(this.output, record);
        console[level.method](line);
        if (!this.writesToFile()) {
            return;
        }
        // Rendered once when both sinks agree, which is every default setup.
        this.writeToFile(this.fileOutput === this.output
            ? line
            : this.render(this.fileOutput, record));
    }
    render(output, record) {
        return output === 'json'
            ? this.renderJson(record)
            : this.renderText(record);
    }
    renderText(record) {
        const body = record.args.map(Helper.formatArg).join(' ');
        const header = this.header(record.level, record.date);
        const line = body ? `${header} ${body}` : header;
        return record.frames ? `${line}\n${record.frames}` : line;
    }
    /**
     * One JSON object per line: msg stays a stable string to group by, the rest
     * stays typed. Falls back to the text line rather than dropping the entry,
     * since the logger's promise is that it never throws on what you log.
     */
    renderJson(record) {
        try {
            const json = {
                time: record.date.toISOString(),
                level: record.level.name,
            };
            const rest = record.args.slice();
            const words = [];
            while (rest.length > 0 && typeof rest[0] === 'string') {
                words.push(rest.shift());
            }
            if (words.length > 0) {
                json.msg = words.join(' ');
            }
            const at = rest.findIndex((value) => value instanceof Error);
            if (at !== -1) {
                json.err = Helper.jsonValue(rest.splice(at, 1)[0], []);
            }
            if (rest.length > 0) {
                json.args = rest.map(Helper.jsonArg);
            }
            if (record.frames) {
                json.stack = record.frames;
            }
            return JSON.stringify(json);
        }
        catch (error) {
            return this.renderText(record);
        }
    }
    header(level, date) {
        const time = `[${Helper.localDate(date)} ${Helper.localTime(date)}]`;
        return this.useColor
            ? `${Helper.styles.reset}${Helper.styles.bold}${level.color}${time} ${level.label}:${Helper.styles.reset}`
            : `${time} ${level.label}:`;
    }
    writesToFile() {
        return this.logInFile && this.canWriteFiles;
    }
    writeToFile(line) {
        this.queue.push(`${Helper.stripColor(line)}\n`);
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
        if (this.queue.length === 0 &&
            !this.writing &&
            this.flushTimer === undefined) {
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
        // Rendered like any other line, so a JSON console stays parseable even
        // when the sink it is complaining about is the broken one.
        console.error(this.render(this.output, {
            level: Helper.levels.error,
            date: new Date(),
            args: [
                `logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`,
            ],
            frames: '',
        }));
    }
}
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFpREE7Ozs7Ozs7R0FPRztBQUNILE1BQU0sTUFBTTtJQXFFRCxNQUFNLENBQUMsTUFBTTtRQUNoQixPQUFPLENBQ0gsT0FBTyxPQUFPLEtBQUssV0FBVztZQUM5QixDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVE7WUFDbEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUMxQixDQUFDO0lBQ04sQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxlQUFlO1FBQ3pCLElBQUksTUFBTSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7WUFDbEMsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSTtnQkFDQSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFN0IsSUFDSSxPQUFPLEVBQUUsQ0FBQyxRQUFRLEtBQUssVUFBVTtvQkFDakMsT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFDakM7b0JBQ0UsTUFBTSxDQUFDLFdBQVcsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO2lCQUMvQzthQUNKO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ1osTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7YUFDN0I7U0FDSjtRQUVELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQztJQUM5QixDQUFDO0lBRU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFXO1FBQzFCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELGtGQUFrRjtJQUMz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