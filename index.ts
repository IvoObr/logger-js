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
    reset = "\x1b[0m",
    underscore = "\x1b[4m",
    reverse = "\x1b[7m",
    bold = "\033[0m"
}

enum call {
    info = 'INFO',
    warn = 'WARN',
    trace = 'TRACE',
    error = 'ERROR',
    success = 'SUCCESS'
} 

class logger {

    private readonly logFileName: string = 'logger-mogger.log';

    public info(...msg: any[]): void  {
        const args: any[] = [
            colors.white,
            call.info,
            ...arguments,
            styles.reset
        ];

        this.prepareAndSend.apply(this, args);
    }

    public warn(...msg: any[]): void {
        const args: any[] = [
            colors.yellow,
            call.warn,
            ...arguments,
            styles.reset
        ];

        this.prepareAndSend.apply(this, args);
    }

    public trace(...msg: any[]): void {
        const args: any[] = [
            colors.dim,
            call.trace,
            ...arguments,
            styles.reset
        ];

        this.prepareAndSend.apply(this, args);
    }

    public error(...msg: any[]): void {
        const args: any[] = [
            colors.red,
            call.error,
            ...arguments,
            styles.reset
        ];

        this.prepareAndSend.apply(this, args);
    }

    public success(...msg: any[]): void {
        const args: any[] = [
            colors.green,
            call.success,
            ...arguments,
            styles.reset
        ];

        this.prepareAndSend.apply(this, args);
    }

    private prepareAndSend(...msg: any[]): void {
        const caller: string = this.getCaller(msg);
        const time: string = this.getTime();
        const args: any[] = [...arguments];
        args.splice(1, 0, time)

        if (typeof process !== 'undefined') {
            NodeLog[caller].apply(this, args)
            this.writeToFile(util.format.apply(this, args) + '\n');
        }

        if (typeof window !== 'undefined') {
            BrowserLog[caller].apply(this, args)
        }
    }

    private getTime(): string {
        const time: string = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);

        return `[${time}]`;
    }

    private getCaller(msg: any[]): string {
        return msg
            .splice(1, 1)[0]
            .toLowerCase();
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

    static info(...msg: any[]): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    static warn(...msg: any[]): void {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }

    static trace(...msg: any[]): void {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }

    static error(...msg: any[]): void {
        console.error(console.error.apply(this, arguments) + '\n');
    }

    static success(...msg: any[]): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }
}

class NodeLog {

    static info(...msg: any[]): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    static warn(...msg: any[]): void {       
        process.stderr.write(util.format.apply(this, arguments) + '\n');
    }

    static trace(...msg: any[]): void {
        const error: Error = new Error;
        const args: any[] = [...arguments]
        const time: string = args.splice(0, 1)[0];

        error.name = time;
        error.message = util.format.apply(this, args);

        Error.captureStackTrace(error, this.trace); 
        // console.log(error.stack.split(' '));
    
        NodeLog.warn(error.stack.replace(':', ''));
    }

    static error(...msg: any[]): void {
        const error: Error = new Error;
        const args: any[] = [...arguments]
        const time: string = args.splice(0, 1)[0];

        error.name = time;
        error.message = util.format.apply(this, args);

        Error.captureStackTrace(error, this.error);
        NodeLog.warn(error.stack.replace(':', ''));
    }

    static success(...msg: any[]): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }
}

export default new logger();