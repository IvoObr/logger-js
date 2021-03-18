declare class logger {
    private logFileName;
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
    private infoNode;
    private warnNode;
    private traceNode;
    private errorNode;
    private successNode;
    private infoBrowser;
    private warnBrowser;
    private traceBrowser;
    private errorBrowser;
    private successBrowser;
    private prepareAndSend;
    private getTime;
    private getCaller;
    private writeToFile;
    private doFileExist;
}
declare const _default: logger;
export default _default;
