declare abstract class Log {
    abstract info(...msg: any[]): void;
    abstract warn(...msg: any[]): void;
    abstract trace(...msg: any[]): void;
    abstract error(...msg: any[]): void;
    abstract success(...msg: any[]): void;
}
declare class logger extends Log {
    private Browser;
    private Node;
    private readonly logFileName;
    constructor(Browser: BrowserLog, Node: NodeLog);
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
    private prepareAndSend;
    private getTime;
    private getCaller;
    private writeToFile;
    private doFileExist;
}
declare class BrowserLog extends Log {
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
}
declare class NodeLog extends Log {
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
}
declare const _default: logger;
export default _default;
