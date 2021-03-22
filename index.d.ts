declare abstract class Log {
    abstract info(): void;
    abstract warn(): void;
    abstract trace(): void;
    abstract error(): void;
    abstract success(): void;
}
export default class Logger extends Log {
    private nodeLog;
    private browserLog;
    private readonly magic_number;
    constructor(doFileLog?: boolean, fileName?: string);
    info(...msg: any[]): void;
    warn(...msg: any[]): void;
    trace(...msg: any[]): void;
    error(...msg: any[]): void;
    success(...msg: any[]): void;
    private prepareAndSend;
    private getTime;
}
export {};
