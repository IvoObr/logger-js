type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ILevel {
    label: string;
    color: string;
    method: ConsoleMethod;
    /** Appends the caller's stack to the line. */
    stack?: boolean;
    /** Only emitted when logLevel is 'debug'. */
    gated?: boolean;
}

export type LogLevel = 'debug' | 'prod';

/** Line format: the human-readable line, or one JSON object per line. */
export type LogOutput = 'text' | 'json';

/** What every level method is: the arguments to log, and nothing returned. */
export type LogMethod = (...msg: any[]) => void;

export interface ILogOptions {
    logInFile?: boolean;
    useColor?: boolean;
    fileName?: string;
    /** Only 'debug' unlocks debug output; typed loosely so process.env values fit. */
    logLevel?: LogLevel | (string & {});
    /** Line format. Defaults to 'text'. */
    output?: LogOutput;
    /** Overrides `output` for the file sink only. Defaults to `output`. */
    fileOutput?: LogOutput;
}

/**
 * One log call, kept as data until a sink asks for a rendering: text and JSON
 * need the same facts and disagree on every detail of how they are written.
 */
interface ILogRecord {
    time: Date;
    level: ILevel;
    args: any[];
    /** The caller's frames, for the levels that capture them. */
    stack?: string;
}

interface INodeModules {
    fs: typeof import('fs');
    path: typeof import('path');
}

/**
 * Everything Logger needs but does not expose. Members are static rather than
 * per-instance because the state here - the module cache and the buffering
 * registry - is process-wide by design, shared by every Logger.
 *
 * Methods never read 'this': Helper.formatArg is passed unbound to Array.map,
 * so every internal reference is qualified with Helper instead.
 */
class Helper {

    private static readonly ESC: string = String.fromCharCode(27);

    private static readonly colors = {
        red: `${Helper.ESC}[31m`,
        green: `${Helper.ESC}[32m`,
        yellow: `${Helper.ESC}[33m`,
        blue: `${Helper.ESC}[34m`,
        white: `${Helper.ESC}[37m`,
        cyan: `${Helper.ESC}[36m`
    };

    public static readonly styles = {
        reset: `${Helper.ESC}[0m`,
        bold: `${Helper.ESC}[1m`
    };

    public static readonly ANSI: RegExp = new RegExp(`${Helper.ESC}\\[[0-9;]*m`, 'g');

    public static readonly levels: { [name: string]: ILevel } = {
        info: { label: 'INFO', color: Helper.colors.white, method: 'info' },
        warn: { label: 'WARN', color: Helper.colors.yellow, method: 'warn' },
        error: { label: 'ERROR', color: Helper.colors.red, method: 'error' },
        trace: { label: 'TRACE', color: Helper.colors.blue, method: 'log', stack: true },
        debug: { label: 'DEBUG', color: Helper.colors.cyan, method: 'debug', gated: true },
        success: { label: 'SUCCESS', color: Helper.colors.green, method: 'log' }
    };

    private static nodeModules: INodeModules | null | undefined;

    private static readonly buffering: Logger[] = [];

    private static exitHookInstalled: boolean = false;

    public static isNode(): boolean {
        return typeof process !== 'undefined' && !!process.versions && !!process.versions.node;
    }

    /**
     * Loaded on first use rather than imported, so a browser bundle never has to
     * resolve 'fs'. package.json also maps 'fs' and 'path' to false for bundlers.
     */
    public static loadNodeModules(): INodeModules | null {
        if (Helper.nodeModules === undefined) {
            Helper.nodeModules = null;
            try {
                const fs = require('fs');
                const path = require('path');

                if (typeof fs.openSync === 'function' && typeof path.join === 'function') {
                    Helper.nodeModules = { fs: fs, path: path };
                }
            } catch (error) {
                Helper.nodeModules = null;
            }
        }

        return Helper.nodeModules;
    }

    private static pad(num: number): string {
        return String(num).padStart(2, '0');
    }

    /** Local calendar date, so file names line up with the timestamps inside them. */
    public static localDate(date: Date): string {
        return `${date.getFullYear()}-${Helper.pad(date.getMonth() + 1)}-${Helper.pad(date.getDate())}`;
    }

    public static localTime(date: Date): string {
        return `${Helper.pad(date.getHours())}:${Helper.pad(date.getMinutes())}:${Helper.pad(date.getSeconds())}`;
    }

    private static className(value: object): string {
        const proto: any = Object.getPrototypeOf(value);

        if (!proto || proto === Object.prototype) {
            return '';
        }

        const name: string = proto.constructor && proto.constructor.name;

        return name && name !== 'Object' ? `${name} ` : '';
    }

    /**
     * Serializes a value in full, whatever it is: no depth limit, cycles become
     * "[Circular]", and BigInt, symbols, functions and Errors all survive.
     */
    private static stringify(value: any, seen: any[]): string {
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
                return `[${value.map((item: any): string => Helper.stringify(item, seen)).join(',')}]`;
            }
            if (value instanceof Map) {
                const entries: string[] = [];
                value.forEach((val: any, key: any): void => {
                    entries.push(`${Helper.stringify(key, seen)}:${Helper.stringify(val, seen)}`);
                });
                return `Map(${value.size}) {${entries.join(',')}}`;
            }
            if (value instanceof Set) {
                const items: string[] = [];
                value.forEach((item: any): void => {
                    items.push(Helper.stringify(item, seen));
                });
                return `Set(${value.size}) [${items.join(',')}]`;
            }

            const props: string[] = Object.keys(value).map((key: string): string => {
                let serialized: string;
                try {
                    serialized = Helper.stringify(value[key], seen);
                } catch (error) {
                    serialized = '"[Throws]"';
                }
                return `${JSON.stringify(key)}:${serialized}`;
            });

            return `${Helper.className(value)}{${props.join(',')}}`;

        } finally {
            seen.pop();
        }
    }

    /** Top-level arguments: strings and Errors print bare, everything else serialized. */
    public static formatArg(value: any): string {
        try {
            if (typeof value === 'string') {
                return value;
            }
            if (value instanceof Error) {
                return value.stack || `${value.name}: ${value.message}`;
            }
            return Helper.stringify(value, []);

        } catch (error) {
            return '[Unserializable]';
        }
    }

    /**
     * The typeof cases JSON.stringify cannot represent, and the two it can.
     * A table rather than a switch so each mapping stays one expression.
     */
    private static readonly jsonPrimitives: { [type: string]: (value: any) => any } = {
        string: (value: any): string => value,
        boolean: (value: any): boolean => value,
        number: (value: any): number => (Object.is(value, -0) ? 0 : value),
        undefined: (): string => '[undefined]',
        bigint: (value: any): string => `${value}n`,
        symbol: (value: any): string => value.toString(),
        function: (value: any): string => `[Function: ${value.name || 'anonymous'}]`
    };

    /** The object kinds JSON would flatten to {} or lose entirely, in check order. */
    private static readonly jsonKinds: { is: (value: any) => boolean; to: (value: any, seen: any[]) => any }[] = [
        { is: (value: any): boolean => value instanceof Error, to: (value: any): any => Helper.jsonError(value) },
        { is: (value: any): boolean => value instanceof Date, to: (value: any): any => Helper.jsonDate(value) },
        { is: (value: any): boolean => value instanceof RegExp, to: (value: any): any => String(value) },
        { is: (value: any): boolean => Array.isArray(value), to: (value: any, seen: any[]): any => Helper.jsonArray(value, seen) },
        { is: (value: any): boolean => value instanceof Map, to: (value: any, seen: any[]): any => Helper.jsonMap(value, seen) },
        { is: (value: any): boolean => value instanceof Set, to: (value: any, seen: any[]): any => Helper.jsonSet(value, seen) }
    ];

    /**
     * A JSON-safe value for anything at all: the sibling of stringify, keeping the
     * same guarantees - no depth limit, cycles become "[Circular]" - while producing
     * a value JSON.stringify can render rather than a display string.
     */
    public static jsonValue(value: any, seen: any[]): any {
        const primitive: ((input: any) => any) | undefined = Helper.jsonPrimitives[typeof value];

        if (primitive) {
            return primitive(value);
        }
        if (value === null) {
            return null;
        }

        return Helper.jsonRef(value, seen);
    }

    /** Everything reached by reference, guarded against the cycles that reach it twice. */
    private static jsonRef(value: object, seen: any[]): any {
        if (seen.indexOf(value) !== -1) {
            return '[Circular]';
        }

        seen.push(value);
        try {
            return Helper.jsonObject(value, seen);

        } finally {
            seen.pop();
        }
    }

    private static jsonObject(value: any, seen: any[]): any {
        for (const kind of Helper.jsonKinds) {
            if (kind.is(value)) {
                return kind.to(value, seen);
            }
        }

        return Helper.jsonPlain(value, seen);
    }

    /** The three fields a log store wants from an Error, whatever else it carries. */
    private static jsonError(value: Error): any {
        return { type: value.name, message: value.message, stack: value.stack };
    }

    private static jsonDate(value: Date): string {
        return isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
    }

    private static jsonArray(value: any[], seen: any[]): any[] {
        return value.map((item: any): any => Helper.jsonValue(item, seen));
    }

    private static jsonMap(value: Map<any, any>, seen: any[]): any {
        const entries: any[][] = [];

        value.forEach((item: any, key: any): void => {
            entries.push([Helper.jsonValue(key, seen), Helper.jsonValue(item, seen)]);
        });

        return { __type: 'Map', entries: entries };
    }

    private static jsonSet(value: Set<any>, seen: any[]): any {
        const values: any[] = [];

        value.forEach((item: any): void => {
            values.push(Helper.jsonValue(item, seen));
        });

        return { __type: 'Set', values: values };
    }

    /** Own enumerable keys only; the class name is display, and JSON has no room for it. */
    private static jsonPlain(value: any, seen: any[]): any {
        const plain: any = {};

        Object.keys(value).forEach((key: string): void => {
            plain[key] = Helper.jsonProperty(value, key, seen);
        });

        return plain;
    }

    /** A getter that throws costs its own key, not the line. */
    private static jsonProperty(value: any, key: string, seen: any[]): any {
        try {
            return Helper.jsonValue(value[key], seen);

        } catch (error) {
            return '[Throws]';
        }
    }

    /**
     * One JSON object for the record, or undefined when it cannot be rendered -
     * the caller falls back to the text line rather than dropping the entry.
     */
    public static renderJson(record: ILogRecord): string | undefined {
        try {
            return JSON.stringify(Helper.jsonRecord(record));

        } catch (error) {
            return undefined;
        }
    }

    /** The queryable shape: a stable msg to group by, typed values beside it. */
    private static jsonRecord(record: ILogRecord): any {
        const rest: any[] = record.args.slice();
        const msg: string | undefined = Helper.takeMsg(rest);
        const err: Error | undefined = Helper.takeError(rest);

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
    private static takeMsg(args: any[]): string | undefined {
        const lead: string[] = [];

        while (args.length > 0 && typeof args[0] === 'string') {
            lead.push(args.shift());
        }

        return lead.length > 0 ? lead.join(' ') : undefined;
    }

    /** Takes the first Error off `args`, since the record carries it as `err`. */
    private static takeError(args: any[]): Error | undefined {
        const index: number = args.findIndex((arg: any): boolean => arg instanceof Error);

        if (index === -1) {
            return undefined;
        }

        return args.splice(index, 1)[0];
    }

    /** Drops the fields this record has nothing to say about. */
    private static compact(fields: any): any {
        const kept: any = {};

        Object.keys(fields).forEach((key: string): void => {
            if (fields[key] !== undefined) {
                kept[key] = fields[key];
            }
        });

        return kept;
    }

    /** An option that has to be one of two words, or the caller's fallback. */
    public static mode(value: any, fallback: LogOutput): LogOutput {
        return value === 'json' || value === 'text' ? value : fallback;
    }

    /** An option that has to be a boolean, or the caller's fallback. */
    public static flag(value: any, fallback: boolean): boolean {
        return typeof value === 'boolean' ? value : fallback;
    }

    /** An option that has to be a string, or the caller's fallback. */
    public static text(value: any, fallback: string): string {
        return typeof value === 'string' ? value : fallback;
    }

    /** A file name has to be a string with something in it. */
    public static fileName(value: any): string {
        return typeof value === 'string' && value.trim() !== '' ? value : 'logger.log';
    }

    /**
     * The caller's stack, without the frames inside this module. Error.captureStackTrace
     * is V8-only, so other engines keep the few extra frames rather than crash.
     */
    public static captureFrames(boundary: Function): string {
        const error: Error = new Error();

        if (typeof (Error as any).captureStackTrace === 'function') {
            (Error as any).captureStackTrace(error, boundary);
        }

        const stack: string = error.stack || '';
        const lines: string[] = stack.split('\n').filter((line: string): boolean => /^\s+at\s/.test(line));

        return lines.length > 0 ? lines.join('\n') : stack.split('\n').slice(1).join('\n');
    }

    /**
     * One process-wide 'exit' listener drains every logger that still has buffered
     * lines, rather than one listener per instance.
     */
    public static trackBuffering(logger: Logger): void {
        if (Helper.buffering.indexOf(logger) === -1) {
            Helper.buffering.push(logger);
        }

        if (Helper.exitHookInstalled || typeof process === 'undefined' || typeof process.once !== 'function') {
            return;
        }

        Helper.exitHookInstalled = true;
        process.once('exit', (): void => {
            Helper.buffering.slice().forEach((pending: Logger): void => pending.flush());
        });
    }

    public static untrackBuffering(logger: Logger): void {
        const index: number = Helper.buffering.indexOf(logger);

        if (index !== -1) {
            Helper.buffering.splice(index, 1);
        }
    }
}

export class Logger {

    private readonly useColor: boolean;
    private readonly logInFile: boolean;
    private readonly logLevel: string;
    private readonly baseFileName: string;
    private readonly canWriteFiles: boolean;
    private readonly output: LogOutput;
    private readonly fileOutput: LogOutput;

    private queue: string[] = [];
    private flushTimer: any;
    private writing: boolean = false;
    private fd: number | undefined;
    private fdPath: string | undefined;
    private writeErrorReported: boolean = false;

    constructor(options?: ILogOptions) {
        const given: ILogOptions = options || {};
        const node: boolean = Helper.isNode();

        this.canWriteFiles = node;
        this.useColor = Helper.flag(given.useColor, node);
        this.logInFile = Helper.flag(given.logInFile, true);
        this.logLevel = Helper.text(given.logLevel, 'prod');
        this.baseFileName = Helper.fileName(given.fileName);
        this.output = Helper.mode(given.output, 'text');
        this.fileOutput = Helper.mode(given.fileOutput, this.output);
    }

    public readonly info: LogMethod = this.at('info');
    public readonly warn: LogMethod = this.at('warn');
    public readonly trace: LogMethod = this.at('trace');
    public readonly error: LogMethod = this.at('error');
    public readonly debug: LogMethod = this.at('debug');
    public readonly success: LogMethod = this.at('success');

    /**
     * The six level methods say the same thing about six levels, so they are one
     * factory rather than six bodies. The built function is its own stack boundary,
     * which is what keeps the frames a trace captures starting at the caller.
     */
    private at(name: string): LogMethod {
        const method: LogMethod = (...msg: any[]): void => this.emit(Helper.levels[name], msg, method);

        return method;
    }

    /** Writes any buffered lines to disk immediately. */
    public flush(): void {
        this.drain(true);
    }

    private emit(level: ILevel, msg: any[], boundary?: Function): void {
        if (level.gated && this.logLevel !== 'debug') {
            return;
        }

        const record: ILogRecord = {
            time: new Date(),
            level: level,
            args: msg,
            stack: this.frames(level, boundary)
        };

        console[level.method](this.render(record, this.output));
        this.writeToFile(record);
    }

    /** The caller's frames, for the levels that ask for them and only then. */
    private frames(level: ILevel, boundary?: Function): string | undefined {
        return level.stack ? Helper.captureFrames(boundary || this.emit) : undefined;
    }

    /**
     * The rendering this sink asked for. JSON that cannot be built falls back to
     * the text line, so an entry is never lost to its own serialization.
     */
    private render(record: ILogRecord, output: LogOutput): string {
        const json: string | undefined = output === 'json' ? Helper.renderJson(record) : undefined;

        return json === undefined ? this.renderText(record) : json;
    }

    /** The human-readable line: header, arguments as they were passed, then any stack. */
    private renderText(record: ILogRecord): string {
        const body: string = record.args.map(Helper.formatArg).join(' ');
        const head: string = this.header(record.level, record.time);
        const line: string = body ? `${head} ${body}` : head;

        return record.stack ? `${line}\n${record.stack}` : line;
    }

    private header(level: ILevel, date: Date): string {
        const time: string = `[${Helper.localDate(date)} ${Helper.localTime(date)}]`;

        return this.useColor
            ? `${Helper.styles.reset}${Helper.styles.bold}${level.color}${time} ${level.label}:${Helper.styles.reset}`
            : `${time} ${level.label}:`;
    }

    private writeToFile(record: ILogRecord): void {
        if (!this.logInFile || !this.canWriteFiles) {
            return;
        }

        const line: string = this.render(record, this.fileOutput);

        this.queue.push(`${line.replace(Helper.ANSI, '')}\n`);
        this.scheduleDrain();
    }

    /**
     * Batches lines instead of opening, writing and closing the file per call.
     * The timer is unref'd, so a process that is otherwise done exits at once
     * and the 'exit' hook flushes what is left synchronously.
     */
    private scheduleDrain(): void {
        if (this.flushTimer !== undefined) {
            return;
        }

        Helper.trackBuffering(this);
        this.flushTimer = setTimeout((): void => {
            this.flushTimer = undefined;
            this.drain(false);
        }, 0);

        if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
            this.flushTimer.unref();
        }
    }

    private drain(sync: boolean): void {
        const modules: INodeModules | null = Helper.loadNodeModules();

        if (!modules || this.queue.length === 0 || (this.writing && !sync)) {
            return;
        }

        const data: string = this.queue.join('');
        this.queue.length = 0;

        try {
            const fd: number = this.openFile(modules);

            if (sync) {
                modules.fs.writeSync(fd, data);
                this.writeErrorReported = false;
                this.settle();
                return;
            }

            this.writing = true;
            modules.fs.write(fd, data, (error: any): void => {
                this.writing = false;

                if (error) {
                    this.reportWriteError(error);
                } else {
                    this.writeErrorReported = false;
                }

                this.drain(false);
                this.settle();
            });

        } catch (error) {
            this.writing = false;
            this.reportWriteError(error);
            this.settle();
        }
    }

    private settle(): void {
        if (this.queue.length === 0 && !this.writing && this.flushTimer === undefined) {
            Helper.untrackBuffering(this);
        }
    }

    /**
     * Keeps one appending descriptor open, reopening only when the resolved
     * path changes - which happens when the local date rolls over.
     */
    private openFile(modules: INodeModules): number {
        const target: string = this.filePath(modules);

        if (this.fd !== undefined && this.fdPath === target) {
            return this.fd;
        }

        if (this.fd !== undefined) {
            try {
                modules.fs.closeSync(this.fd);
            } catch (error) {
                // The descriptor is being replaced either way.
            }
            this.fd = undefined;
        }

        const dir: string = modules.path.dirname(target);

        if (dir && dir !== '.') {
            modules.fs.mkdirSync(dir, { recursive: true });
        }

        this.fd = modules.fs.openSync(target, 'a');
        this.fdPath = target;

        return this.fd;
    }

    /** Date-stamps the file name, leaving any directory in fileName intact. */
    private filePath(modules: INodeModules): string {
        const stamp: string = Helper.localDate(new Date());
        const dir: string = modules.path.dirname(this.baseFileName);
        const base: string = modules.path.basename(this.baseFileName);

        return modules.path.join(dir, `${stamp}-${base}`);
    }

    /** Reported once per failure streak, so a bad path cannot flood the console. */
    private reportWriteError(error: any): void {
        if (this.writeErrorReported) {
            return;
        }

        this.writeErrorReported = true;
        const reason: string = error instanceof Error ? error.message : String(error);

        console.error(`${this.header(Helper.levels.error, new Date())} logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`);
    }
}
