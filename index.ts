import fs from 'fs';
import util from 'util';

// todo readme
// todo test all
// todo rainbow
// todo local date

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

enum mapColors {
    INFO = <any>colors.white,
    WARN = <any>colors.yellow,
    TRACE = <any>colors.blue,
    ERROR = <any>colors.red,
    SUCCESS = <any>colors.green
}

export default class Logger {

    private readonly magic_number: number = 19;

    constructor(doFileLog?: boolean, fileName?: string) {
        if (typeof doFileLog === 'boolean') {
            NodeLog.doFileLog = doFileLog;
        }  
        if (typeof fileName === 'string') {
            NodeLog.fileName = fileName;
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
        const color: colors = mapColors[caller];
        const header: string = `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}`;

        args.unshift(header);

        if (typeof process !== 'undefined') {
            NodeLog[call[caller]].apply(this, args);
        }

        if (typeof window !== 'undefined') {
            BrowserLog[call[caller]].apply(this, args);
        }
    }

    private getTime(): string {
        const time: string = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, this.magic_number);

        return `[${time}]`;
    }
}

class BrowserLog {

    public static info(): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    public static warn(): void {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }

    public static trace(): void {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }

    public static error(): void {
        console.error(console.error.apply(this, arguments) + '\n');
    }

    public static success(): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }
}

class NodeLog {

    public static doFileLog: boolean = true;
    public static fileName: string = 'logger.log';

    public static info(msg): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
        NodeLog.writeToFile(util.format.apply(this, arguments) + '\n');    
    }

    public static warn(): void {
        process.stderr.write(util.format.apply(this, arguments) + '\n');
        NodeLog.writeToFile(util.format.apply(this, arguments) + '\n');    
    }

    public static trace(): void {
        NodeLog.setStack.apply(this, arguments);
    }

    public static error(): void {
        NodeLog.setStack.apply(this, arguments);

    }
    public static success(): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
        NodeLog.writeToFile(util.format.apply(this, arguments) + '\n');    
    }

    private static setStack(): void {
        const error: Error = new Error;
        const args: any[] = [...arguments];
        const header: string = args.shift();
        const caller: string = (header.indexOf('ERROR') > -1) ? 'error' : 'trace';

        error.name = header;
        error.message = util.format.apply(this, args);

        Error.captureStackTrace(error, this[caller]);
        NodeLog.warn.call(this, error.stack);
    }

    private static writeToFile(msg: string): void {
        try {
            if (!NodeLog.doFileLog) {
                return;
            }

            const fileExists: boolean = this.doFileExist();

            if (fileExists) {
                fs.appendFileSync(NodeLog.fileName, msg);

            } else {
                fs.writeFileSync(NodeLog.fileName, msg);
            }

        } catch (error) {
            console.error(error);
        }
    }

    private static doFileExist(): boolean {
        try {
            fs.accessSync(NodeLog.fileName);
            return true;

        } catch (error) {
            return false;
        }
    }
}