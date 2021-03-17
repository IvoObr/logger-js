import fs from 'fs';
import util from 'util';

// '\x1b[36m%s\x1b[0m'


// todo readme


// todo make colors enum
const reset: string = "\x1b[0m";
const bright: string = "\x1b[1m";
const dim: string = "\x1b[2m";
const underscore: string = "\x1b[4m";
const blink: string = "\x1b[5m";
const reverse: string = "\x1b[7m";
const hidden: string = "\x1b[8m";
const black: string = "\x1b[30m";
const red: string = "\x1b[31m";
const green: string = "\x1b[32m";
const yellow: string = "\x1b[33m";
const blue: string = "\x1b[34m";
const magenta: string = "\x1b[35m";
const cyan: string = "\x1b[36m";
const white: string = "\x1b[37m";
const BGblack: string = "\x1b[40m";
const BGred: string = "\x1b[41m";
const BGgreen: string = "\x1b[42m";
const BGyellow: string = "\x1b[43m";
const BGblue: string = "\x1b[44m";
const BGmagenta: string = "\x1b[45m";
const BGcyan: string = "\x1b[46m";
const BGwhite: string = "\x1b[47m";

 enum call {
    info = 'info', 
    warn = 'warn',
    trace = 'trace',
    error = 'error',
    success = 'success',
} 
// const bold: string = "\033[0m";

 interface ILogLevel {
    color: string,
    prefix: string;
}

export interface ILogOptions {
    logFileName: string,
    writeInFile: boolean
}

class logger {

    private logFileName: string = 'logger-mogger.log';
    private writeInFile: boolean = true;

    constructor(options?: ILogOptions) {

 //todo check if is it node or window

        if (typeof options?.logFileName === 'string') {
            this.logFileName = options?.logFileName;
        }

        if (typeof options?.writeInFile === 'boolean') {
            this.writeInFile = options?.writeInFile;
        }
    }

    private isNode = (): boolean => (process && true)

    private middleware(method: call, args: any[]): void {
        
        switch (method) {
            case call.info:
                if (this.isNode()) {
                    
                } else {
                    
                }
                break;
            case call.warn:
                if (this.isNode()) {
                    
                } else {
                    
                }
                break;
            case call.trace:
                if (this.isNode()) {
                    
                } else {
                    
                }
                break;
            case call.error:
                if (this.isNode()) {
                    
                } else {
                    
                }
                break;
            case call.success:
                if (this.isNode()) {
                    
                } else {
                    
                }
                break;
            default:
                if (this.isNode()) {
                    
                } else {
                    
                }
                break;
        }
    }

    // todo rename library to just logger

    public info(...msg): void  {

        if (process) {
            this.infoNode.apply(this, arguments)
        }
        else {
            this.infoBrowser.apply(this, arguments)
        }


        // this.print(msg, {
        //     color: white,
        //     prefix: 'INFO:   '
        // });
    }

    public warn(...msg): void {
        this.print(msg, {
            color: yellow,
            prefix: 'WARNING:'
        });
    }

    public trace(...msg): void {
        this.print(msg, {
            color: white,
            prefix: 'TRACE:  '
        });
    }

    public error(...msg): void {
        this.print(msg, {
            color: red,
            prefix: 'ERROR:  '
        });
    }

    public success(...msg): void {
        this.print(msg, {
            color: green,
            prefix: 'SUCCESS:'
        });
    }

    public infoNode(...msg) {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    private warnNode(): void {
        process.stderr.write(util.format.apply(this, arguments) + '\n');
    }

    private traceNode(): void {
        var error: Error = new Error;
        error.name = 'Trace';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.traceNode);
        this.error(error.stack);
    }

    private errorNode(): void {
        var error: Error = new Error;
        error.name = 'Error';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.errorNode);
        this.error(error.stack);
    }

    private successNode(): void {
        process.stdout.write(util.format.apply(this, arguments) + '\n');
    }

    private infoBrowser(msg): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }

    private warnBrowser(): void {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }

    private traceBrowser(): void {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }

    private errorBrowser(): void {
        console.error(console.error.apply(this, arguments) + '\n');
    }

    private successBrowser(): void {
        console.log(console.log.apply(this, arguments) + '\n');
    }


    private print(msg: string[], level: ILogLevel): void {
        let output: string = '';
        // console.log(msg);
        // console.log(JSON.parse(JSON.stringify(msg)))

        // for (let index: number = 0; index < msg.length; index++) {
        //     // console.log(msg[index]);
        //     output += msg[index]
        // }

        // console.log(output);
        
        

        // const time: string = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';
        
        // console.log(time,level.color,level.prefix,reset,level.color,msg,reset);
        // msg = time + level.color + level.prefix + reset + level.color + msg + reset;

        // console.log(msg);
        
        // if (this.writeInFile) {   
        //     this.writeToFile(`${time} ${level.prefix} ${msg += '\r\n'}`); 
        //     // this.writeToFile(msg)
        // }
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