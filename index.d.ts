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
export declare class Logger {
    private readonly useColor;
    private readonly logInFile;
    private readonly logLevel;
    private readonly baseFileName;
    private readonly canWriteFiles;
    private readonly output;
    private readonly fileOutput;
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
    private render;
    private renderText;
    /**
     * One JSON object per line: msg stays a stable string to group by, the rest
     * stays typed. Falls back to the text line rather than dropping the entry,
     * since the logger's promise is that it never throws on what you log.
     */
    private renderJson;
    private header;
    private writesToFile;
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
