"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
// '\x1b[36m%s\x1b[0m'
// todo readme
// todo make colors enum
const reset = "\x1b[0m";
const bright = "\x1b[1m";
const dim = "\x1b[2m";
const underscore = "\x1b[4m";
const blink = "\x1b[5m";
const reverse = "\x1b[7m";
const hidden = "\x1b[8m";
const black = "\x1b[30m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";
const cyan = "\x1b[36m";
const white = "\x1b[37m";
const BGblack = "\x1b[40m";
const BGred = "\x1b[41m";
const BGgreen = "\x1b[42m";
const BGyellow = "\x1b[43m";
const BGblue = "\x1b[44m";
const BGmagenta = "\x1b[45m";
const BGcyan = "\x1b[46m";
const BGwhite = "\x1b[47m";
var call;
(function (call) {
    call["info"] = "INFO";
    call["warn"] = "WARN";
    call["trace"] = "TRACE";
    call["error"] = "ERROR";
    call["success"] = "SUCCESS";
})(call || (call = {}));
class logger {
    constructor(options) {
        //todo check if is it node or window
        this.logFileName = 'logger-mogger.log';
        this.writeInFile = true;
        this.isNode = () => (process && true);
        if (typeof (options === null || options === void 0 ? void 0 : options.logFileName) === 'string') {
            this.logFileName = options === null || options === void 0 ? void 0 : options.logFileName;
        }
        if (typeof (options === null || options === void 0 ? void 0 : options.writeInFile) === 'boolean') {
            this.writeInFile = options === null || options === void 0 ? void 0 : options.writeInFile;
        }
    }
    // todo rename library to just logger
    prepare(...msg) {
        const callee = msg.splice(1, 1)[0].toLocaleLowerCase();
        const time = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';
        if (process) {
            this[callee + 'Node'].apply(this, [time, ...arguments]);
            console.log('---------------------');
            console.log(arguments);
            this.writeToFile(util_1.default.format.apply(this, [time, ...arguments]) + '\n');
        }
        else {
            this[callee + 'Browser'].apply(this, [time, ...arguments]);
        }
    }
    info(...msg) {
        this.prepare.apply(this, [yellow, call.info, reset, ...arguments]);
    }
    warn(...msg) {
        this.print(msg, {
            color: yellow,
            prefix: 'WARNING:'
        });
    }
    trace(...msg) {
        this.print(msg, {
            color: white,
            prefix: 'TRACE:  '
        });
    }
    error(...msg) {
        this.print(msg, {
            color: red,
            prefix: 'ERROR:  '
        });
    }
    success(...msg) {
        this.print(msg, {
            color: green,
            prefix: 'SUCCESS:'
        });
    }
    infoNode(...msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    warnNode() {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    traceNode() {
        var error = new Error;
        error.name = 'Trace';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.traceNode);
        this.error(error.stack);
    }
    errorNode() {
        var error = new Error;
        error.name = 'Error';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.errorNode);
        this.error(error.stack);
    }
    successNode() {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    infoBrowser(msg) {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    warnBrowser() {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }
    traceBrowser() {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }
    errorBrowser() {
        console.error(console.error.apply(this, arguments) + '\n');
    }
    successBrowser() {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    print(msg, level) {
        // const time: string = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';
        // console.log(time,level.color,level.prefix,reset,level.color,msg,reset);
        // msg = time + level.color + level.prefix + reset + level.color + msg + reset;
        // if (this.writeInFile) {   
        //     this.writeToFile(`${time} ${level.prefix} ${msg += '\r\n'}`); 
        //     // this.writeToFile(msg)
        // }
    }
    writeToFile(msg) {
        try {
            const fileExists = this.doFileExist();
            if (fileExists) {
                fs_1.default.appendFileSync(this.logFileName, msg);
            }
            else {
                fs_1.default.writeFileSync(this.logFileName, msg);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    doFileExist() {
        try {
            fs_1.default.accessSync(this.logFileName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.default = new logger();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsc0JBQXNCO0FBR3RCLGNBQWM7QUFHZCx3QkFBd0I7QUFDeEIsTUFBTSxLQUFLLEdBQVcsU0FBUyxDQUFDO0FBQ2hDLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQztBQUNqQyxNQUFNLEdBQUcsR0FBVyxTQUFTLENBQUM7QUFDOUIsTUFBTSxVQUFVLEdBQVcsU0FBUyxDQUFDO0FBQ3JDLE1BQU0sS0FBSyxHQUFXLFNBQVMsQ0FBQztBQUNoQyxNQUFNLE9BQU8sR0FBVyxTQUFTLENBQUM7QUFDbEMsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDO0FBQ2pDLE1BQU0sS0FBSyxHQUFXLFVBQVUsQ0FBQztBQUNqQyxNQUFNLEdBQUcsR0FBVyxVQUFVLENBQUM7QUFDL0IsTUFBTSxLQUFLLEdBQVcsVUFBVSxDQUFDO0FBQ2pDLE1BQU0sTUFBTSxHQUFXLFVBQVUsQ0FBQztBQUNsQyxNQUFNLElBQUksR0FBVyxVQUFVLENBQUM7QUFDaEMsTUFBTSxPQUFPLEdBQVcsVUFBVSxDQUFDO0FBQ25DLE1BQU0sSUFBSSxHQUFXLFVBQVUsQ0FBQztBQUNoQyxNQUFNLEtBQUssR0FBVyxVQUFVLENBQUM7QUFDakMsTUFBTSxPQUFPLEdBQVcsVUFBVSxDQUFDO0FBQ25DLE1BQU0sS0FBSyxHQUFXLFVBQVUsQ0FBQztBQUNqQyxNQUFNLE9BQU8sR0FBVyxVQUFVLENBQUM7QUFDbkMsTUFBTSxRQUFRLEdBQVcsVUFBVSxDQUFDO0FBQ3BDLE1BQU0sTUFBTSxHQUFXLFVBQVUsQ0FBQztBQUNsQyxNQUFNLFNBQVMsR0FBVyxVQUFVLENBQUM7QUFDckMsTUFBTSxNQUFNLEdBQVcsVUFBVSxDQUFDO0FBQ2xDLE1BQU0sT0FBTyxHQUFXLFVBQVUsQ0FBQztBQUVsQyxJQUFLLElBTUw7QUFOQSxXQUFLLElB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