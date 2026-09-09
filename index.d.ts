export type LogLevel = 'debug' | 'prod';
export interface ILogOptions {
    logInFile?: boolean;
    useColor?: boolean;
    fileName?: string;
    /** Only 'debug' unlocks debug output; typed loosely so process.env values fit. */
    logLevel?: LogLevel | (string & {});
}
export declare class Logger {
    private readonly useColor;
    private readonly logInFile;
    private readonly logLevel;
    private readonly baseFileName;
    private readonly canWriteFiles;
    private queue;
    private flushTimer;
    private writing;
    private fd;
    private fdPath;
    private writeErrorReported;
    constructor(options?: ILogOptions);
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    debug(...msg: any[]): void;
    success(...msg: any[]): void;
    /** Writes any buffered lines to disk immediately. */
    flush(): void;
    private emit;
    private header;
    private writeToFile;
    /**
     * Batches lines instead of opening, writing and closing the file per call.
     * The timer is unref'd, so a process that is otherwise done exits at once
     * and the 'exit' hook flushes what is left synchronously.
     */
    private scheduleDrain;
    private drain;
    private settle;
    /**
     * Keeps one appending descriptor open, reopening only when the resolved
     * path changes - which happens when the local date rolls over.
     */
    private openFile;
    /** Date-stamps the file name, leaving any directory in fileName intact. */
    private filePath;
    /** Reported once per failure streak, so a bad path cannot flood the console. */
    private reportWriteError;
}
