declare class logger {
    private readonly logFileName;
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
    private prepareAndSend;
    private getTime;
    private writeToFile;
    private doFileExist;
}
declare const _default: logger;
export default _default;
