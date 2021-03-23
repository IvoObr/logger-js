import fs from 'fs';
import util from 'util';

// todo readme

enum colors {
    bright = "\x1b[1m",
    dim = "\x1b[2m",
    red = "\x1b[31m",
    green = "\x1b[32m",
    yellow = "\x1b[33m",
    blue = "\x1b[34m",
    white = "\x1b[37m"
}

enum styles {
    reset = '\x1b[0m',
    underscore = '\x1b[4m',
    reverse = '\x1b[7m',
    bold = '\u001b[1m'
}

enum call {
    info = <any>'INFO',
    warn = <any>'WARN',
    trace = <any>'TRACE',
    error = <any>'ERROR',
    success = <any>'SUCCESS'
}

enum colorsMap {
    INFO = <any>colors.white,
    WARN = <any>colors.yellow,
    TRACE = <any>colors.blue,
    ERROR = <any>colors.red,
    SUCCESS = <any>colors.green
}

enum logMap {
    INFO = 'log',
    WARN = 'warn',
    TRACE = 'trace',
    ERROR = 'error',
    SUCCESS = 'log'
}

export default class Logger {

    private doFileLog: boolean = true;
    private fileName: string = 'logger.log';
    private readonly magic_number: number = 19;
    private readonly isWindow: boolean = false;

    constructor(doFileLog?: boolean, fileName?: string) {
        if (typeof doFileLog === 'boolean') {
            this.doFileLog = doFileLog;
        }

        if (typeof window !== 'undefined') {
            this.isWindow = true;
        }

        if (typeof fileName === 'string') {
            this.fileName = fileName;
        }
    }

    public info(...msg: any[]): void {
        const args: any[] = [call.info, ...arguments];
        this.prepareAndSend.apply(this, args);
    }

    public warn(...msg: any[]): void {
        const args: any[] = [call.warn, ...arguments];
        this.prepareAndSend.apply(this, args);
    }

    public trace(...msg: any[]): void {
        const args: any[] = [call.trace, ...arguments];
        this.prepareAndSend.apply(this, args);
    }

    public error(...msg: any[]): void {
        const args: any[] = [call.error, ...arguments];
        this.prepareAndSend.apply(this, args);
    }

    public success(...msg: any[]): void {
        const args: any[] = [call.success, ...arguments];
        this.prepareAndSend.apply(this, args);
    }

    private prepareAndSend(): void {
        const args: any[] = [...arguments];
        const caller: string = args.shift();
        const time: string = this.getTime();
        const color: colors = colorsMap[caller];
        const header: string = this.isWindow ?
            `${styles.reset}${styles.bold}${time} ${caller}:${styles.reset}`
            : `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}`;

        args.unshift(header);

        if (logMap[caller] === 'log' || logMap[caller] === 'warn') {
            console[logMap[caller]].apply(this, args);
            this.writeToFile(util.format.apply(this, args) + '\n');
        }

        if (logMap[caller] === 'trace' || logMap[caller] === 'error') {
                this.setStack.apply(this, args);
        }
    }

    private getTime(): string {
        const time: string = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, this.magic_number);

        return `[${time}]`;
    }

    private setStack(): void {
        const error: Error = new Error;
        const args: any[] = [...arguments];
        const header: string = args.shift();
        const caller: string = (header.indexOf('ERROR') > -1) ? 'error' : 'trace';

        error.name = header;
        error.message = util?.formatWithOptions?.apply(this, [{ colors: true }, ...args])
            || this.arrayToString(args);      
                   
        Error.captureStackTrace(error, this[caller]);
        console.warn.call(this, error.stack);
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