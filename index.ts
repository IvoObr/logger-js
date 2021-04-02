import fs from 'fs';
import util from 'util';

enum colors {
    red = "\x1b[31m",
    green = "\x1b[32m",
    yellow = "\x1b[33m",
    blue = "\x1b[34m",
    white = "\x1b[37m"
}

enum styles {
    reset = '\x1b[0m',
    bold = '\u001b[1m'
}

enum call {
    info = <any>'INFO',
    warn = <any>'WARN',
    trace = <any>'TRACE',
    error = <any>'ERROR',
    success = <any>'SUCCESS'
}

export class Logger {
    private readonly doFileLog: boolean = true;
    private readonly isWindow: boolean = false;
    private readonly _magic_number: number = 19;
    private _fileName: string = 'logger.log';

    private get fileName() {
        const date: string = new Date().toISOString().split('T')[0]
        return `${date}-${this._fileName}`;
    }

    private set fileName(fileName: string) {
        this._fileName = fileName;
    }

    constructor(doFileLog?: boolean, fileName?: string) {
        if (typeof window !== 'undefined') {
            this.isWindow = true;
        }
        if (typeof fileName === 'string') {
            this.fileName = fileName;
        }
        if (typeof doFileLog === 'boolean') {
            this.doFileLog = doFileLog;
        }
    }

    public info(...msg: any[]): void {
        this.prepareAndSend(call.info, colors.white, msg);
    }

    public warn(...msg: any[]): void {
        this.prepareAndSend(call.warn, colors.yellow, msg);
    }

    public trace(...msg: any[]): void {
        this.prepareAndSend(call.trace, colors.blue, msg)
    }

    public error(...msg: any[]): void {
        this.prepareAndSend(call.error, colors.red, msg);
    }

    public success(...msg: any[]): void {
        this.prepareAndSend(call.success, colors.green, msg)
    }

    private prepareAndSend(caller: any, color: colors, msg: any[]): void {
        const time: string = this.getTime();
        const header: string = `${styles.reset}${styles.bold}${this.isWindow ? '' : color}${time} ${caller}:${styles.reset}`;
        msg.unshift(header);
        msg = this.stringifyObjects(msg);

        if (caller == 'INFO' || caller == 'WARN') {
            (console as any)[call[caller]].apply(this, msg);
            this.writeToFile(util.format.apply(this, msg as any) + '\n');
        }

        if (caller == 'SUCCESS') {
            console.log.apply(this, msg);
            this.writeToFile(util.format.apply(this, msg as any) + '\n');
        }

        if (caller == 'TRACE' || caller == 'ERROR') {
            (this.setStack as any).apply(this, msg);
        }
    }

    private stringifyObjects(msg: any[]): any[] {
        return msg.map((el: any): any =>
            typeof el === 'object' ?
            JSON.stringify(el) : el)
    }

    private getTime(): string {
        const time: string = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, this._magic_number);

        return `[${time}]`;
    }

    private setStack(): void {
        const error: Error = new Error;
        const args: any[] = [...arguments];
        const header: string = args.shift();
        const caller: string = header.includes('ERROR') ? 'error' : 'trace';
        const method: string = (this.isWindow) ? caller : 'error';

        error.name = header;       
        error.message = args.join(' ')

        Error.captureStackTrace(error, (this as any)[caller]);
        (console as any)[method].call(this, error.stack);
        this.writeToFile((util.format as any).call(this, error.stack) + '\n');
    }

    private writeToFile(msg: string): void {
        try {
            if (!this.doFileLog || this.isWindow) {
                return;
            }
            msg = msg.replace(/\u001b\[.*?m/g, '');
            const fileExists: boolean = this.doFileExist();

            if (fileExists) {
                fs.appendFileSync(this.fileName, msg);

            } else {
                fs.writeFileSync(this.fileName, msg);
            }

        } catch (error) {
            console.error(error);
        }
    }

    private doFileExist(): boolean {
        try {
            fs.accessSync(this.fileName);
            return true;

        } catch (error) {
            return false;
        }
    }
}