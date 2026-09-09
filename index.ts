const ESC: string = String.fromCharCode(27);

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

const ANSI: RegExp = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

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

const levels: { [name: string]: ILevel } = {
    info: { label: 'INFO', color: colors.white, method: 'info' },
    warn: { label: 'WARN', color: colors.yellow, method: 'warn' },
    error: { label: 'ERROR', color: colors.red, method: 'error' },
    trace: { label: 'TRACE', color: colors.blue, method: 'log', stack: true },
    debug: { label: 'DEBUG', color: colors.cyan, method: 'debug', gated: true },
    success: { label: 'SUCCESS', color: colors.green, method: 'log' }
};

export type LogLevel = 'debug' | 'prod';

export interface ILogOptions {
    logInFile?: boolean;
    useColor?: boolean;
    fileName?: string;
    /** Only 'debug' unlocks debug output; typed loosely so process.env values fit. */
    logLevel?: LogLevel | (string & {});
}

interface INodeModules {
    fs: typeof import('fs');
    path: typeof import('path');
}

const isNode = (): boolean =>
    typeof process !== 'undefined' && !!process.versions && !!process.versions.node;

let nodeModules: INodeModules | null | undefined;

/**
 * Loaded on first use rather than imported, so a browser bundle never has to
 * resolve 'fs'. package.json also maps 'fs' and 'path' to false for bundlers.
 */
function loadNodeModules(): INodeModules | null {
    if (nodeModules === undefined) {
        nodeModules = null;
        try {
            const fs = require('fs');
            const path = require('path');

            if (typeof fs.openSync === 'function' && typeof path.join === 'function') {
                nodeModules = { fs: fs, path: path };
            }
        } catch (error) {
            nodeModules = null;
        }
    }

    return nodeModules;
}

const pad = (num: number): string => String(num).padStart(2, '0');

/** Local calendar date, so file names line up with the timestamps inside them. */
function localDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(date: Date): string {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function className(value: object): string {
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
function stringify(value: any, seen: any[]): string {
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
            return `[${value.map((item: any): string => stringify(item, seen)).join(',')}]`;
        }
        if (value instanceof Map) {
            const entries: string[] = [];
            value.forEach((val: any, key: any): void => {
                entries.push(`${stringify(key, seen)}:${stringify(val, seen)}`);
            });
            return `Map(${value.size}) {${entries.join(',')}}`;
        }
        if (value instanceof Set) {
            const items: string[] = [];
            value.forEach((item: any): void => {
                items.push(stringify(item, seen));
            });
            return `Set(${value.size}) [${items.join(',')}]`;
        }

        const props: string[] = Object.keys(value).map((key: string): string => {
            let serialized: string;
            try {
                serialized = stringify(value[key], seen);
            } catch (error) {
                serialized = '"[Throws]"';
            }
            return `${JSON.stringify(key)}:${serialized}`;
        });

        return `${className(value)}{${props.join(',')}}`;

    } finally {
        seen.pop();
    }
}

/** Top-level arguments: strings and Errors print bare, everything else serialized. */
function formatArg(value: any): string {
    try {
        if (typeof value === 'string') {
            return value;
        }
        if (value instanceof Error) {
            return value.stack || `${value.name}: ${value.message}`;
        }
        return stringify(value, []);

    } catch (error) {
        return '[Unserializable]';
    }
}

/**
 * The caller's stack, without the frames inside this module. Error.captureStackTrace
 * is V8-only, so other engines keep the few extra frames rather than crash.
 */
function captureFrames(boundary: Function): string {
    const error: Error = new Error();

    if (typeof (Error as any).captureStackTrace === 'function') {
        (Error as any).captureStackTrace(error, boundary);
    }

    const stack: string = error.stack || '';
    const lines: string[] = stack.split('\n').filter((line: string): boolean => /^\s+at\s/.test(line));

    return lines.length > 0 ? lines.join('\n') : stack.split('\n').slice(1).join('\n');
}

const buffering: Logger[] = [];
let exitHookInstalled: boolean = false;

/**
 * One process-wide 'exit' listener drains every logger that still has buffered
 * lines, rather than one listener per instance.
 */
function trackBuffering(logger: Logger): void {
    if (buffering.indexOf(logger) === -1) {
        buffering.push(logger);
    }

    if (exitHookInstalled || typeof process === 'undefined' || typeof process.once !== 'function') {
        return;
    }

    exitHookInstalled = true;
    process.once('exit', (): void => {
        buffering.slice().forEach((pending: Logger): void => pending.flush());
    });
}

function untrackBuffering(logger: Logger): void {
    const index: number = buffering.indexOf(logger);

    if (index !== -1) {
        buffering.splice(index, 1);
    }
}

export class Logger {

    private readonly useColor: boolean;
    private readonly logInFile: boolean;
    private readonly logLevel: string;
    private readonly baseFileName: string;
    private readonly canWriteFiles: boolean;

    private queue: string[] = [];
    private flushTimer: any;
    private writing: boolean = false;
    private fd: number | undefined;
    private fdPath: string | undefined;
    private writeErrorReported: boolean = false;

    constructor(options?: ILogOptions) {
        const node: boolean = isNode();

        this.canWriteFiles = node;
        this.useColor = typeof options?.useColor === 'boolean' ? options.useColor : node;
        this.logInFile = typeof options?.logInFile === 'boolean' ? options.logInFile : true;
        this.logLevel = typeof options?.logLevel === 'string' ? options.logLevel : 'prod';
        this.baseFileName = typeof options?.fileName === 'string' && options.fileName.trim() !== ''
            ? options.fileName
            : 'logger.log';
    }

    public info(...msg: any[]): void {
        this.emit(levels.info, msg);
    }

    public warn(...msg: any[]): void {
        this.emit(levels.warn, msg);
    }

    public trace(...msg: any[]): void {
        this.emit(levels.trace, msg, this.trace);
    }

    public error(...msg: any[]): void {
        this.emit(levels.error, msg);
    }

    public debug(...msg: any[]): void {
        this.emit(levels.debug, msg);
    }

    public success(...msg: any[]): void {
        this.emit(levels.success, msg);
    }

    /** Writes any buffered lines to disk immediately. */
    public flush(): void {
        this.drain(true);
    }

    private emit(level: ILevel, msg: any[], boundary?: Function): void {
        if (level.gated && this.logLevel !== 'debug') {
            return;
        }

        const body: string = msg.map(formatArg).join(' ');
        let line: string = body ? `${this.header(level)} ${body}` : this.header(level);

        if (level.stack) {
            const frames: string = captureFrames(boundary || this.emit);
            if (frames) {
                line += `\n${frames}`;
            }
        }

        console[level.method](line);
        this.writeToFile(line);
    }

    private header(level: ILevel): string {
        const date: Date = new Date();
        const time: string = `[${localDate(date)} ${localTime(date)}]`;

        return this.useColor
            ? `${styles.reset}${styles.bold}${level.color}${time} ${level.label}:${styles.reset}`
            : `${time} ${level.label}:`;
    }

    private writeToFile(line: string): void {
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
    private scheduleDrain(): void {
        if (this.flushTimer !== undefined) {
            return;
        }

        trackBuffering(this);
        this.flushTimer = setTimeout((): void => {
            this.flushTimer = undefined;
            this.drain(false);
        }, 0);

        if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
            this.flushTimer.unref();
        }
    }

    private drain(sync: boolean): void {
        const modules: INodeModules | null = loadNodeModules();

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
            untrackBuffering(this);
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
        const stamp: string = localDate(new Date());
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

        console.error(`${this.header(levels.error)} logger cannot write to ${this.fdPath || this.baseFileName}: ${reason}`);
    }
}
