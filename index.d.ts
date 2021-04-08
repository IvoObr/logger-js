export interface ILogOptions {
    logInFile?: boolean;
    useColor?: boolean;
    fileName?: string;
    logLevel?: string;
}
export declare class Logger {
    private _fileName;
    private readonly useColor;
    private readonly logInFile;
    private readonly isWindow;
    private readonly logLevel;
    private readonly _magic_number;
    private get fileName();
    private set fileName(value);
    constructor(options?: ILogOptions);
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    debug(...msg: any[]): void;
    success(...msg: any[]): void;
    private prepareAndSend;
    private stringifyObjects;
    private getTime;
    private setStack;
    private writeToFile;
    private fileExists;
}
