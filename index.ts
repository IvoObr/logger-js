import fs from 'fs';
import util from 'util';

// todo readme

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

export default class Logger {

    private readonly doFileLog: boolean = true;
    private readonly isWindow: boolean = false;
    private readonly _magic_number: number = 19;
    private readonly fileName: string = 'logger.log';

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
        this.prepareAndSend(call.info, colors.white, ...msg);
    }

    public warn(...msg: any[]): void {
        this.prepareAndSend(call.warn, colors.yellow ,...msg);
    }

    public trace(...msg: any[]): void {
        this.prepareAndSend(call.trace, colors.blue, ...msg)
    }

    public error(...msg: any[]): void {
        this.prepareAndSend(call.error, colors.red, ...msg);
    }

    public success(...msg: any[]): void {
        this.prepareAndSend(call.success, colors.green, ...msg)
    }

    private prepareAndSend(...msg: any[]): void {
        const caller: string = msg.shift();
        const color: colors = msg.shift();
        const time: string = this.getTime();
        const header: string = `${styles.reset}${styles.bold}${this.isWindow ? '' : color}${time} ${caller}:${styles.reset}`;
        msg.unshift(header);

        if (caller == 'INFO' || caller == 'WARN') {
            console[call[caller]].apply(this, msg);
            this.writeToFile(util.format.apply(this, msg) + '\n');
        }

        if (caller == 'SUCCESS') {
            console.log.apply(this, msg);
            this.writeToFile(util.format.apply(this, msg) + '\n');
        }

        if (caller == 'TRACE' || caller == 'ERROR') {
            this.setStack.apply(this, msg);
        }
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
        error.name = header; 
        Error.captureStackTrace(error, this[caller]);

        if (this.isWindow) {
            error.message = this.arrayToString(args);
            console[caller].call(this, error.stack);
        } else {
            error.message = util.formatWithOptions.apply(this, [{ colors: true }, ...args]); 
            console.error.call(this, error.stack);
        }

        this.writeToFile(util.format.call(this, error.stack) + '\n');
    }

    private arrayToString(array: any[]): string {
        let result: string = '';

        for (let index: number = 0; index < array.length; index++) {
            result += JSON.stringify(array[index]) + ' ';  
        }
        return result;
    }

    private writeToFile(msg: string): void {
        try {
            if (!this.doFileLog || this.isWindow) {
                return;
            }

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