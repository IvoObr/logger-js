export default class Logger {
    private doFileLog;
    private fileName;
    private readonly magic_number;
    constructor(doFileLog?: boolean, fileName?: string);
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
    private prepareAndSend;
    private getTime;
    private setStack;
    private writeToFile;
    private doFileExist;
}
