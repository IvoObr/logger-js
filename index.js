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
     * A JSON-safe value for anything at all: the sibling of stringify, keeping the
     * same guarantees - no depth limit, cycles become "[Circular]" - while producing
     * a value JSON.stringify can render rather than a display string.
     */
    static jsonValue(value, seen) {
        const primitive = Helper.jsonPrimitives[typeof value];
        if (primitive) {
            return primitive(value);
        }
        if (value === null) {
            return null;
        }
        return Helper.jsonRef(value, seen);
    }
    /** Everything reached by reference, guarded against the cycles that reach it twice. */
    static jsonRef(value, seen) {
        if (seen.indexOf(value) !== -1) {
            return '[Circular]';
        }
        seen.push(value);
        try {
            return Helper.jsonObject(value, seen);
        }
        finally {
            seen.pop();
        }
    }
    static jsonObject(value, seen) {
        for (const kind of Helper.jsonKinds) {
            if (kind.is(value)) {
                return kind.to(value, seen);
            }
        }
        return Helper.jsonPlain(value, seen);
    }
    /** The three fields a log store wants from an Error, whatever else it carries. */
    static jsonError(value) {
        return { type: value.name, message: value.message, stack: value.stack };
    }
    static jsonDate(value) {
        return isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
    }
    static jsonArray(value, seen) {
        return value.map((item) => Helper.jsonValue(item, seen));
    }
    static jsonMap(value, seen) {
        const entries = [];
        value.forEach((item, key) => {
            entries.push([Helper.jsonValue(key, seen), Helper.jsonValue(item, seen)]);
        });
        return { __type: 'Map', entries: entries };
    }
    static jsonSet(value, seen) {
        const values = [];
        value.forEach((item) => {
            values.push(Helper.jsonValue(item, seen));
        });
        return { __type: 'Set', values: values };
    }
    /** Own enumerable keys only; the class name is display, and JSON has no room for it. */
    static jsonPlain(value, seen) {
        const plain = {};
        Object.keys(value).forEach((key) => {
            plain[key] = Helper.jsonProperty(value, key, seen);
        });
        return plain;
    }
    /** A getter that throws costs its own key, not the line. */
    static jsonProperty(value, key, seen) {
        try {
            return Helper.jsonValue(value[key], seen);
        }
        catch (error) {
            return '[Throws]';
        }
    }
    /**
     * One JSON object for the record, or undefined when it cannot be rendered -
     * the caller falls back to the text line rather than dropping the entry.
     */
    static renderJson(record) {
        try {
            return JSON.stringify(Helper.jsonRecord(record));
        }
        catch (error) {
            return undefined;
        }
    }
    /** The queryable shape: a stable msg to group by, typed values beside it. */
    static jsonRecord(record) {
        const rest = record.args.slice();
        const msg = Helper.takeMsg(rest);
        const err = Helper.takeError(rest);
        return Helper.compact({
            time: record.time.toISOString(),
            level: record.level.label.toLowerCase(),
            msg: msg,
            args: rest.length > 0 ? Helper.jsonArray(rest, []) : undefined,
            err: err && Helper.jsonError(err),
            stack: record.stack
        });
    }
    /** Takes the leading strings off `args`, joined as they read in the text line. */
    static takeMsg(args) {
        const lead = [];
        while (args.length > 0 && typeof args[0] === 'string') {
            lead.push(args.shift());
        }
        return lead.length > 0 ? lead.join(' ') : undefined;
    }
    /** Takes the first Error off `args`, since the record carries it as `err`. */
    static takeError(args) {
        const index = args.findIndex((arg) => arg instanceof Error);
        if (index === -1) {
            return undefined;
        }
        return args.splice(index, 1)[0];
    }
    /** Drops the fields this record has nothing to say about. */
    static compact(fields) {
        const kept = {};
        Object.keys(fields).forEach((key) => {
            if (fields[key] !== undefined) {
                kept[key] = fields[key];
            }
        });
        return kept;
    }
    /** An option that has to be one of two words, or the caller's fallback. */
    static mode(value, fallback) {
        return value === 'json' || value === 'text' ? value : fallback;
    }
    /** An option that has to be a boolean, or the caller's fallback. */
    static flag(value, fallback) {
        return typeof value === 'boolean' ? value : fallback;
    }
    /** An option that has to be a string, or the caller's fallback. */
    static text(value, fallback) {
        return typeof value === 'string' ? value : fallback;
    }
    /** A file name has to be a string with something in it. */
    static fileName(value) {
        return typeof value === 'string' && value.trim() !== '' ? value : 'logger.log';
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
/**
 * The typeof cases JSON.stringify cannot represent, and the two it can.
 * A table rather than a switch so each mapping stays one expression.
 */
Helper.jsonPrimitives = {
    string: (value) => value,
    boolean: (value) => value,
    number: (value) => (Object.is(value, -0) ? 0 : value),
    undefined: () => '[undefined]',
    bigint: (value) => `${value}n`,
    symbol: (value) => value.toString(),
    function: (value) => `[Function: ${value.name || 'anonymous'}]`
};
/** The object kinds JSON would flatten to {} or lose entirely, in check order. */
Helper.jsonKinds = [
    { is: (value) => value instanceof Error, to: (value) => Helper.jsonError(value) },
    { is: (value) => value instanceof Date, to: (value) => Helper.jsonDate(value) },
    { is: (value) => value instanceof RegExp, to: (value) => String(value) },
    { is: (value) => Array.isArray(value), to: (value, seen) => Helper.jsonArray(value, seen) },
    { is: (value) => value instanceof Map, to: (value, seen) => Helper.jsonMap(value, seen) },
    { is: (value) => value instanceof Set, to: (value, seen) => Helper.jsonSet(value, seen) }
];
class Logger {
    constructor(options) {
        this.queue = [];
        this.writing = false;
        this.writeErrorReported = false;
        const given = options || {};
        const node = Helper.isNode();
        this.canWriteFiles = node;
        this.useColor = Helper.flag(given.useColor, node);
        this.logInFile = Helper.flag(given.logInFile, true);
        this.logLevel = Helper.text(given.logLevel, 'prod');
        this.baseFileName = Helper.fileName(given.fileName);
        this.output = Helper.mode(given.output, 'text');
        this.fileOutput = Helper.mode(given.fileOutput, this.output);
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
            time: new Date(),
            level: level,
            args: msg,
            stack: this.frames(level, boundary)
        };
        console[level.method](this.render(record, this.output));
        this.writeToFile(record);
    }
    /** The caller's frames, for the levels that ask for them and only then. */
    frames(level, boundary) {
        return level.stack ? Helper.captureFrames(boundary || this.emit) : undefined;
    }
    /**
     * The rendering this sink asked for. JSON that cannot be built falls back to
     * the text line, so an entry is never lost to its own serialization.
     */
    render(record, output) {
        const json = output === 'json' ? Helper.renderJson(record) : undefined;
        return json === undefined ? this.renderText(record) : json;
    }
    /** The human-readable line: header, arguments as they were passed, then any stack. */
    renderText(record) {
        const body = record.args.map(Helper.formatArg).join(' ');
        const head = this.header(record.level, record.time);
        const line = body ? `${head} ${body}` : head;
        return record.stack ? `${line}\n${record.stack}` : line;
    }
    header(level, date) {
        const time = `[${Helper.localDate(date)} ${Helper.localTime(date)}]`;
        return this.useColor
            ? `${Helper.styles.reset}${Helper.styles.bold}${level.color}${time} ${level.label}:${Helper.styles.reset}`
            : `${time} ${level.label}:`;
    }
    writeToFile(record) {
        if (!this.logInFile || !this.canWriteFiles) {
            return;
        }
        const line = this.render(record, this.fileOutput);
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
        console.error(`${this.header(Helper.levels.error, new Date())} logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUE4Q0E7Ozs7Ozs7R0FPRztBQUNILE1BQU0sTUFBTTtJQW1DRCxNQUFNLENBQUMsTUFBTTtRQUNoQixPQUFPLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFDM0YsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxlQUFlO1FBQ3pCLElBQUksTUFBTSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7WUFDbEMsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSTtnQkFDQSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFN0IsSUFBSSxPQUFPLEVBQUUsQ0FBQyxRQUFRLEtBQUssVUFBVSxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7b0JBQ3RFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztpQkFDL0M7YUFDSjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNaLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO2FBQzdCO1NBQ0o7UUFFRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUM7SUFDOUIsQ0FBQztJQUVPLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBVztRQUMxQixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxrRkFBa0Y7SUFDM0UsTUFBTSxDQUFDLFNB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LENBQUM7UUFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVNLElBQUksQ0FBQyxHQUFHLEdBQVU7UUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRU0sSUFBSSxDQUFDLEdBQUcsR0FBVTtRQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxHQUFVO1FBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sS0FBSyxDQUFDLEdBQUcsR0FBVTtRQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxHQUFVO1FBQ3RC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