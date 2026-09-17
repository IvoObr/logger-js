type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface ILevel {
    /** Lowercase level name, used as-is by the JSON renderer. */
    name: string;
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
 * One log call, captured once and rendered per sink. Holds the arguments as
 * they were passed rather than a formatted line, so text and JSON each derive
 * their own shape from the same timestamp, level and frames.
 */
interface ILogRecord {
    level: ILevel;
    date: Date;
    args: any[];
    /** The caller's frames for a trace, '' for every other level. */
    frames: string;
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
        cyan: `${Helper.ESC}[36m`,
    };

    public static readonly styles = {
        reset: `${Helper.ESC}[0m`,
        bold: `${Helper.ESC}[1m`,
    };

    public static readonly ANSI: RegExp = new RegExp(
        `${Helper.ESC}\\[[0-9;]*m`,
        'g'
    );

    public static readonly levels: { [name: string]: ILevel } = {
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

    private static nodeModules: INodeModules | null | undefined;

    private static readonly buffering: Logger[] = [];

    private static exitHookInstalled: boolean = false;

    public static isNode(): boolean {
        return (
            typeof process !== 'undefined' &&
            !!process.versions &&
            !!process.versions.node
        );
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

                if (
                    typeof fs.openSync === 'function' &&
                    typeof path.join === 'function'
                ) {
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
                return JSON.stringify(
                    value.stack || `${value.name}: ${value.message}`
                );
            }
            if (value instanceof Date) {
                return JSON.stringify(
                    isNaN(value.getTime())
                        ? 'Invalid Date'
                        : value.toISOString()
                );
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
                    entries.push(
                        `${Helper.stringify(key, seen)}:${Helper.stringify(val, seen)}`
                    );
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

            const props: string[] = Object.keys(value).map(
                (key: string): string => {
                    let serialized: string;
                    try {
                        serialized = Helper.stringify(value[key], seen);
                    } catch (error) {
                        serialized = '"[Throws]"';
                    }
                    return `${JSON.stringify(key)}:${serialized}`;
                }
            );

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

    /** JSON has no -0, and no representation at all for NaN or Infinity. */
    private static jsonNumber(value: number): number | string {
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
    public static jsonValue(value: any, seen: any[]): any {
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
                return value.map((item: any): any =>
                    Helper.jsonValue(item, seen)
                );
            }
            if (value instanceof Map) {
                const entries: any[] = [];
                value.forEach((val: any, key: any): void => {
                    entries.push([
                        Helper.jsonValue(key, seen),
                        Helper.jsonValue(val, seen),
                    ]);
                });
                return { __type: 'Map', entries: entries };
            }
            if (value instanceof Set) {
                const values: any[] = [];
                value.forEach((item: any): void => {
                    values.push(Helper.jsonValue(item, seen));
                });
                return { __type: 'Set', values: values };
            }

            // Own enumerable keys only, and no class name: a query language has
            // nowhere to put one, and the keys are what is worth indexing.
            const plain: { [key: string]: any } = {};

            Object.keys(value).forEach((key: string): void => {
                try {
                    plain[key] = Helper.jsonValue(value[key], seen);
                } catch (error) {
                    plain[key] = '[Throws]';
                }
            });

            return plain;
        } finally {
            seen.pop();
        }
    }

    /** One top-level argument, with the same never-throws promise as formatArg. */
    public static jsonArg(value: any): any {
        try {
            return Helper.jsonValue(value, []);
        } catch (error) {
            return '[Unserializable]';
        }
    }

    /**
     * Only text lines are ever coloured, so the regex is skipped unless an escape
     * is actually there - which also keeps a JSON payload's own bytes intact.
     */
    public static stripColor(line: string): string {
        return line.indexOf(Helper.ESC) === -1
            ? line
            : line.replace(Helper.ANSI, '');
    }

    /** Anything that is not one of the two modes falls back, as the other options do. */
    public static outputMode(value: any, fallback: LogOutput): LogOutput {
        return value === 'text' || value === 'json' ? value : fallback;
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
        const lines: string[] = stack
            .split('\n')
            .filter((line: string): boolean => /^\s+at\s/.test(line));

        return lines.length > 0
            ? lines.join('\n')
            : stack.split('\n').slice(1).join('\n');
    }

    /**
     * One process-wide 'exit' listener drains every logger that still has buffered
     * lines, rather than one listener per instance.
     */
    public static trackBuffering(logger: Logger): void {
        if (Helper.buffering.indexOf(logger) === -1) {
            Helper.buffering.push(logger);
        }

        if (
            Helper.exitHookInstalled ||
            typeof process === 'undefined' ||
            typeof process.once !== 'function'
        ) {
            return;
        }

        Helper.exitHookInstalled = true;
        process.once('exit', (): void => {
            Helper.buffering
                .slice()
                .forEach((pending: Logger): void => pending.flush());
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
        const node: boolean = Helper.isNode();

        this.canWriteFiles = node;
        this.useColor =
            typeof options?.useColor === 'boolean' ? options.useColor : node;
        this.logInFile =
            typeof options?.logInFile === 'boolean' ? options.logInFile : true;
        this.logLevel =
            typeof options?.logLevel === 'string' ? options.logLevel : 'prod';
        this.baseFileName =
            typeof options?.fileName === 'string' &&
            options.fileName.trim() !== ''
                ? options.fileName
                : 'logger.log';
        this.output = Helper.outputMode(options?.output, 'text');
        this.fileOutput = Helper.outputMode(options?.fileOutput, this.output);
    }

    public info(...msg: any[]): void {
        this.emit(Helper.levels.info, msg);
    }

    public warn(...msg: any[]): void {
        this.emit(Helper.levels.warn, msg);
    }

    public trace(...msg: any[]): void {
        this.emit(Helper.levels.trace, msg, this.trace);
    }

    public error(...msg: any[]): void {
        this.emit(Helper.levels.error, msg);
    }

    public debug(...msg: any[]): void {
        this.emit(Helper.levels.debug, msg);
    }

    public success(...msg: any[]): void {
        this.emit(Helper.levels.success, msg);
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
            level: level,
            date: new Date(),
            args: msg,
            frames: level.stack
                ? Helper.captureFrames(boundary || this.emit)
                : '',
        };

        const line: string = this.render(this.output, record);
        console[level.method](line);

        if (!this.writesToFile()) {
            return;
        }

        // Rendered once when both sinks agree, which is every default setup.
        this.writeToFile(
            this.fileOutput === this.output
                ? line
                : this.render(this.fileOutput, record)
        );
    }

    private render(output: LogOutput, record: ILogRecord): string {
        return output === 'json'
            ? this.renderJson(record)
            : this.renderText(record);
    }

    private renderText(record: ILogRecord): string {
        const body: string = record.args.map(Helper.formatArg).join(' ');
        const header: string = this.header(record.level, record.date);
        const line: string = body ? `${header} ${body}` : header;

        return record.frames ? `${line}\n${record.frames}` : line;
    }

    /**
     * One JSON object per line: msg stays a stable string to group by, the rest
     * stays typed. Falls back to the text line rather than dropping the entry,
     * since the logger's promise is that it never throws on what you log.
     */
    private renderJson(record: ILogRecord): string {
        try {
            const json: { [key: string]: any } = {
                time: record.date.toISOString(),
                level: record.level.name,
            };

            const rest: any[] = record.args.slice();
            const words: string[] = [];

            while (rest.length > 0 && typeof rest[0] === 'string') {
                words.push(rest.shift());
            }

            if (words.length > 0) {
                json.msg = words.join(' ');
            }

            const at: number = rest.findIndex(
                (value: any): boolean => value instanceof Error
            );

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
        } catch (error) {
            return this.renderText(record);
        }
    }

    private header(level: ILevel, date: Date): string {
        const time: string = `[${Helper.localDate(date)} ${Helper.localTime(date)}]`;

        return this.useColor
            ? `${Helper.styles.reset}${Helper.styles.bold}${level.color}${time} ${level.label}:${Helper.styles.reset}`
            : `${time} ${level.label}:`;
    }

    private writesToFile(): boolean {
        return this.logInFile && this.canWriteFiles;
    }

    private writeToFile(line: string): void {
        this.queue.push(`${Helper.stripColor(line)}\n`);
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
        if (
            this.queue.length === 0 &&
            !this.writing &&
            this.flushTimer === undefined
        ) {
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
        const reason: string =
            error instanceof Error ? error.message : String(error);

        // Rendered like any other line, so a JSON console stays parseable even
        // when the sink it is complaining about is the broken one.
        console.error(
            this.render(this.output, {
                level: Helper.levels.error,
                date: new Date(),
                args: [
                    `logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`,
                ],
                frames: '',
            })
        );
    }
}
