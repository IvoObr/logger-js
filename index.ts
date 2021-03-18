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
    info = 'INFO',
    warn = 'WARN',
    trace = 'TRACE',
    error = 'ERROR',
    success = 'SUCCESS'
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


    // todo rename library to just logger

    private prepare(...msg) {
        const callee: string = msg.splice(1, 1)[0].toLocaleLowerCase()

        const time: string = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';

        if (process) {
            this[callee + 'Node'].apply(this, [time, ...arguments])
            console.log('---------------------');
            console.log(arguments);
            Array.prototype.splice(0, 1)//.apply(arguments);
            Array.prototype.splice(1, 1)//.apply(arguments);

            this.writeToFile(util.format.apply(this, [time, ...arguments]) + '\n');
        }
        else {
            this[callee + 'Browser'].apply(this, [time, ...arguments])
        }
    }

    public info(...msg): void  {
        this.prepare.apply(this, [yellow, call.info, reset, ...arguments])
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
        // const time: string = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';
        
        // console.log(time,level.color,level.prefix,reset,level.color,msg,reset);
        // msg = time + level.color + level.prefix + reset + level.color + msg + reset;

        
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

const text = `
--[[ 
'########:'########::'########:'##::::'##:::::'##:::::'##::'#######::'########::'##:::'##::'######::
 ##..  ##: ##.... ##: ##.....:: ##:::: ##::::: ##:'##: ##:'##.... ##: ##.... ##: ##::'##::'##... ##:
..:: ##::: ##:::: ##: ##::::::: ##:::: ##::::: ##: ##: ##: ##:::: ##: ##:::: ##: ##:'##::: ##:::..::
::: ##:::: ##:::: ##: ######::: ##:::: ##:'##: ##: ##: ##: ##:::: ##: ########:: #####::::. ######::
:: ##::::: ##:::: ##: ##...::::. ##:: ##::...: ##: ##: ##: ##:::: ##: ##.. ##::: ##. ##::::..... ##:
:: ##::::: ##:::: ##: ##::::::::. ## ##::::::: ##: ##: ##: ##:::: ##: ##::. ##:: ##:. ##::'##::: ##:
:: ##::::: ########:: ########:::. ###::::::::. ###. ###::. #######:: ##:::. ##: ##::. ##:. ######::
::..::::::........:::........:::::...::::::::::...::...::::.......:::..:::::..::..::::..:::......::: 
--]]
`;
