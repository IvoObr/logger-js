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
    call["info"] = "info";
    call["warn"] = "warn";
    call["trace"] = "trace";
    call["error"] = "error";
    call["success"] = "success";
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
    middleware(method, args) {
        switch (method) {
            case call.info:
                if (this.isNode()) {
                }
                else {
                }
                break;
            case call.warn:
                if (this.isNode()) {
                }
                else {
                }
                break;
            case call.trace:
                if (this.isNode()) {
                }
                else {
                }
                break;
            case call.error:
                if (this.isNode()) {
                }
                else {
                }
                break;
            case call.success:
                if (this.isNode()) {
                }
                else {
                }
                break;
            default:
                if (this.isNode()) {
                }
                else {
                }
                break;
        }
    }
    // todo rename library to just logger
    info(...msg) {
        if (process) {
            this.infoNode.apply(this, arguments);
        }
        else {
            this.infoBrowser.apply(this, arguments);
        }
        // this.print(msg, {
        //     color: white,
        //     prefix: 'INFO:   '
        // });
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
        let output = '';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsc0JBQXNCO0FBR3RCLGNBQWM7QUFHZCx3QkFBd0I7QUFDeEIsTUFBTSxLQUFLLEdBQVcsU0FBUyxDQUFDO0FBQ2hDLE1BQU0sTUFBTSxHQUFXLFNBQVMsQ0FBQztBQUNqQyxNQUFNLEdBQUcsR0FBVyxTQUFTLENBQUM7QUFDOUIsTUFBTSxVQUFVLEdBQVcsU0FBUyxDQUFDO0FBQ3JDLE1BQU0sS0FBSyxHQUFXLFNBQVMsQ0FBQztBQUNoQyxNQUFNLE9BQU8sR0FBVyxTQUFTLENBQUM7QUFDbEMsTUFBTSxNQUFNLEdBQVcsU0FBUyxDQUFDO0FBQ2pDLE1BQU0sS0FBSyxHQUFXLFVBQVUsQ0FBQztBQUNqQyxNQUFNLEdBQUcsR0FBVyxVQUFVLENBQUM7QUFDL0IsTUFBTSxLQUFLLEdBQVcsVUFBVSxDQUFDO0FBQ2pDLE1BQU0sTUFBTSxHQUFXLFVBQVUsQ0FBQztBQUNsQyxNQUFNLElBQUksR0FBVyxVQUFVLENBQUM7QUFDaEMsTUFBTSxPQUFPLEdBQVcsVUFBVSxDQUFDO0FBQ25DLE1BQU0sSUFBSSxHQUFXLFVBQVUsQ0FBQztBQUNoQyxNQUFNLEtBQUssR0FBVyxVQUFVLENBQUM7QUFDakMsTUFBTSxPQUFPLEdBQVcsVUFBVSxDQUFDO0FBQ25DLE1BQU0sS0FBSyxHQUFXLFVBQVUsQ0FBQztBQUNqQyxNQUFNLE9BQU8sR0FBVyxVQUFVLENBQUM7QUFDbkMsTUFBTSxRQUFRLEdBQVcsVUFBVSxDQUFDO0FBQ3BDLE1BQU0sTUFBTSxHQUFXLFVBQVUsQ0FBQztBQUNsQyxNQUFNLFNBQVMsR0FBVyxVQUFVLENBQUM7QUFDckMsTUFBTSxNQUFNLEdBQVcsVUFBVSxDQUFDO0FBQ2xDLE1BQU0sT0FBTyxHQUFXLFVBQVUsQ0FBQztBQUVsQyxJQUFLLElBTUw7QUFOQSxXQUFLLElB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