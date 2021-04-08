import fs from 'fs';
import util from 'util';

enum colors {
    red = "\x1b[31m",
    green = "\x1b[32m",
    yellow = "\x1b[33m",
    blue = "\x1b[34m",
    white = "\x1b[37m",
    cyan = "\x1b[36m"
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
    debug = <any>'DEBUG',
    success = <any>'SUCCESS'
}

type level = 'debug' | 'prod';

export interface ILogOptions {
    logInFile?: boolean;
    useColor?: boolean;
    fileName?: string;
    logLevel?: string;
}

export class Logger {

    private _fileName: string = 'logger.log';
    private readonly useColor: boolean = true;
    private readonly logInFile: boolean = true;
    private readonly isWindow: boolean = false;
    private readonly logLevel: level = 'prod';
    private readonly _magic_number: number = 19;

    private get fileName() {
        const date: string = new Date().toISOString().split('T')[0]
        return `${date}-${this._fileName}`;
    }

    private set fileName(fileName: string) {
        this._fileName = fileName;
    }

    constructor(options?: ILogOptions) {
        if (typeof window !== 'undefined') {
            this.isWindow = true;
        }
        if (options?.logLevel === 'debug') {
            this.logLevel = options.logLevel;
        }
        if (typeof options?.fileName === 'string') {
            this.fileName = options.fileName;
        }
        if (typeof options?.useColor === 'boolean') {
            this.useColor = options.useColor;
        }
        if (typeof options?.logInFile === 'boolean') {
            this.logInFile = options.logInFile;
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

    public debug(...msg: any[]): void {
        this.prepareAndSend(call.debug, colors.cyan, msg)
    }

    public success(...msg: any[]): void {
        this.prepareAndSend(call.success, colors.green, msg)
    }

    private prepareAndSend(caller: any, color: colors, msg: any[]): void {
        const time: string = this.getTime();
        const header: string = `${styles.reset}${styles.bold}${this.useColor ? color : ''}${time} ${caller}:${styles.reset}`;
        msg.unshift(header);
        msg = this.stringifyObjects(msg);

        if (caller === call.info || caller === call.warn || caller === call.error) {
            (console as any)[call[caller]].apply(this, msg);
            this.writeToFile(util.format.apply(this, msg as any) + '\n');
        }

        if (caller === call.success) {
            console.log.apply(this, msg);
            this.writeToFile(util.format.apply(this, msg as any) + '\n');
        }

        if (caller === call.trace) {     
            (this.setStack as any).apply(this, msg);
        }

        if (caller === call.debug && this.logLevel === 'debug') {
            console.debug.apply(this, msg);
            this.writeToFile(util.format.apply(this, msg as any) + '\n');
        }
    }

    private stringifyObjects(msg: any[]): any[] {
        return  msg.map((el: any): any => 
            (el?.constructor === Object) ? JSON.stringify(el) : el);
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
        const caller: string = this.isWindow ? 'trace' : 'log';

        error.name = header;       
        error.message = args.join(' ');

        Error.captureStackTrace(error, this.trace);
        (console as any)[caller].call(this, error.stack);
        this.writeToFile((util.format as any).call(this, error.stack) + '\n');
    }

    private writeToFile(msg: string): void {
        try {
            if (!this.logInFile || this.isWindow) {
                return;
            }
            msg = msg.replace(/\u001b\[.*?m/g, '');
            
            if (this.fileExists()) {
                fs.appendFileSync(this.fileName, msg);
                
            } else {
                fs.writeFileSync(this.fileName, msg);
            }

        } catch (error) {
            console.error(error);
        }
    }

    private fileExists(): boolean {
        try {
            fs.accessSync(this.fileName);
            return true;

        } catch (error) {
            return false;
        }
    }
}