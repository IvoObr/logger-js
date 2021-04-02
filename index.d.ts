export declare class Logger {
    private readonly doFileLog;
    private readonly isWindow;
    private readonly _magic_number;
    private _fileName;
    private get fileName();
    private set fileName(value);
    constructor(doFileLog?: boolean, fileName?: string);
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
    private prepareAndSend;
    private stringifyObjects;
    private getTime;
    private setStack;
    private writeToFile;
    private fileExists;
}
