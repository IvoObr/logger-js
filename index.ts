import { timeStamp } from 'console';
import fs from 'fs';
import util from 'util';

// todo readme
// todo test all
// todo bump version
// todo bold !!! 
// todo namespace
// todo rainbow
// todo remove duplicate code

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
    info = <any>colors.white,
    warn = <any>colors.yellow,
    trace = <any>colors.blue,
    error = <any>colors.red,
    success = <any>colors.green
}

class logger {

    private readonly logFileName: string = 'logger-mogger.log';

    public info(...msg: any[]): void  {
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
        const args: any[] = [ call.error,  ...arguments ];

        this.prepareAndSend.apply(this, args);
    }

    public success(...msg: any[]): void {
        const args: any[] = [ call.success, ...arguments ];

        this.prepareAndSend.apply(this, args);
    }

    private prepareAndSend(): void {       
        const args: any[] = [...arguments];
        const caller: string = args.shift();
        const time: string = this.getTime();
        const color: colors = mapColors[caller.toLowerCase()];
        const message: string = `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}${color}`;
        args.unshift(message);

        if (typeof process !== 'undefined') {
            NodeLog[call[caller]].apply(this, args)
            this.writeToFile(util.format.apply(this, args) + '\n');
        }

        if (typeof window !== 'undefined') {
            BrowserLog[call[caller]].apply(this, args)
        }
    }

    private getTime(): string {
        const time: string = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);

        return `[${time}]`;
    }

    private writeToFile(msg: string): void {
        try {
            const fileExists: boolean = this.doFileExist();

            if (fileExists) {
                fs.appendFileSync(this.logFileName, msg);

            } else {
                fs.writeFileSync(this.logFileName, msg);
            }

        } catch (error) {
            console.error(error);
        }
    }

    private doFileExist(): boolean {
        try {
            fs.accessSync(this.logFileName);
            return true;

        } catch (error) {
            return false;
        }
    }

}

class BrowserLog {

    public static info(...msg: any[]): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    public static warn(...msg: any[]): void {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }

    public static trace(...msg: any[]): void {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }

    public static error(...msg: any[]): void {
        console.error(console.error.apply(this, arguments) + '\n');
    }

    public static success(...msg: any[]): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }
}

class NodeLog {

    public static info(...msg: any[]): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    public static warn(...msg: any[]): void {       
        process.stderr.write(util.format.apply(this, arguments) + '\n');
    }

    public static trace(...msg: any[]): void {
        const error: Error = new Error;
        const args: any[] = [...arguments]
        const time: string = args.splice(0, 1)[0];

        error.name = time;
        error.message = util.format.apply(this, args);

        Error.captureStackTrace(error, this.trace);     
        NodeLog.warn(error.stack);
    }

    public static error(...msg: any[]): void {
        const error: Error = new Error;
        const args: any[] = [...arguments]
        const time: string = args.splice(0, 1)[0];

        error.name = time;
        error.message = util.format.apply(this, args);

        Error.captureStackTrace(error, this.error);
        NodeLog.warn(error.stack);
    }

    public static success(...msg: any[]): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }
}

export default new logger();