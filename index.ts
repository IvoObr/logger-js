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

    private logFileName: string = 'logger-mogger.log';

    public info(...msg: any[]): void  {
        const args: any[] = [
            colors.white,
            call.info,
            styles.reset,
            ...arguments
        ];

        this.prepareAndSend.apply(this, args);
    }

    public warn(...msg: any[]): void {
        const args: any[] = [
            colors.yellow,
            call.warn,
            styles.reset,
            ...arguments
        ];

        this.prepareAndSend.apply(this, args);
    }

    public trace(...msg: any[]): void {
        const args: any[] = [
            colors.dim,
            call.trace,
            styles.reset,
            ...arguments
        ];

        this.prepareAndSend.apply(this, args);
    }

    public error(...msg: any[]): void {
        const args: any[] = [
            colors.red,
            call.error,
            styles.reset,
            ...arguments
        ];
    }

    public success(...msg: any[]): void {
        const args: any[] = [
            colors.green,
            call.success,
            styles.reset,
            ...arguments
        ];
    }

    private infoNode(...msg: any[]): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    private warnNode(...msg: any[]): void {
        process.stderr.write(util.format.apply(this, arguments) + '\n');
    }

    private traceNode(...msg: any[]): void {
        var error: Error = new Error;
        error.name = 'Trace';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.traceNode);
        this.warnNode(error.stack);
    }

    private errorNode(...msg: any[]): void {
        var error: Error = new Error;
        error.name = 'Error';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.errorNode);
        this.warnNode(error.stack);
    }

    private successNode(...msg: any[]): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    private infoBrowser(...msg: any[]): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    private warnBrowser(...msg: any[]): void {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }

    private traceBrowser(...msg: any[]): void {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }

    private errorBrowser(...msg: any[]): void {
        console.error(console.error.apply(this, arguments) + '\n');
    }

    private successBrowser(...msg: any[]): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    private prepareAndSend(...msg: any[]): void {
        const caller: string = this.getCaller(msg);
        const time: string = this.getTime();
        const args: any[] = [time, ...arguments];

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

export default new logger();