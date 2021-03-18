import fs from 'fs';
import util from 'util';

// todo readme
// todo rename library to just logger

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

type all = any[];

class logger {

    private logFileName: string = 'logger-mogger.log';

    public info(...msg: all): void  {
        const args: all = [
            colors.white,
            call.info,
            styles.reset,
            ...arguments
        ];

        this.prepareAndSend.apply(this, args);
    }

    public warn(...msg: all): void {
        const args: all = [
            colors.yellow,
            call.warn,
            styles.reset,
            ...arguments
        ];

        this.prepareAndSend.apply(this, args);
    }

    public trace(...msg: all): void {
        const args: all = [
            colors.dim,
            call.trace,
            styles.reset,
            ...arguments
        ];

        this.prepareAndSend.apply(this, args);
    }

    public error(...msg: all): void {
        const args: all = [
            colors.red,
            call.error,
            styles.reset,
            ...arguments
        ];
    }

    public success(...msg: all): void {
        const args: all = [
            colors.green,
            call.success,
            styles.reset,
            ...arguments
        ];
    }

    public infoNode(...msg: all): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    private warnNode(): void {
        process.stderr.write(util.format.apply(this, arguments) + '\n');
    }

    private traceNode(...msg: all): void {
        var error: Error = new Error;
        error.name = 'Trace';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.traceNode);
        this.error(error.stack);
    }

    private errorNode(...msg: all): void {
        var error: Error = new Error;
        error.name = 'Error';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.errorNode);
        this.error(error.stack);
    }

    private successNode(...msg: all): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    private infoBrowser(...msg: all): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    private warnBrowser(...msg: all): void {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }

    private traceBrowser(...msg: all): void {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }

    private errorBrowser(...msg: all): void {
        console.error(console.error.apply(this, arguments) + '\n');
    }

    private successBrowser(...msg: all): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    private prepareAndSend(...msg: all): void {
        const caller: string = this.getCaller(msg);
        const time: string = this.getTime();
        const args: all = [time, ...arguments];

        if (typeof process !== 'undefined') {
            this[caller + 'Node'].apply(this, args)
            this.writeToFile(util.format.apply(this, args) + '\n');
        }

        if (typeof window !== 'undefined') {
            this[caller + 'Browser'].apply(this, args)
        }
    }

    private getTime(): string {
        const time: string = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);

        return `[${time}]`;
    }

    private getCaller(msg: all): string {
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

export default new logger();