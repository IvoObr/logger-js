"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
var colors;
(function (colors) {
    colors["red"] = "\u001B[31m";
    colors["green"] = "\u001B[32m";
    colors["yellow"] = "\u001B[33m";
    colors["blue"] = "\u001B[34m";
    colors["white"] = "\u001B[37m";
})(colors || (colors = {}));
var styles;
(function (styles) {
    styles["reset"] = "\u001B[0m";
    styles["bold"] = "\u001B[1m";
})(styles || (styles = {}));
var call;
(function (call) {
    call[call["info"] = 'INFO'] = "info";
    call[call["warn"] = 'WARN'] = "warn";
    call[call["trace"] = 'TRACE'] = "trace";
    call[call["error"] = 'ERROR'] = "error";
    call[call["success"] = 'SUCCESS'] = "success";
})(call || (call = {}));
class Logger {
    constructor(doFileLog, fileName) {
        this.doFileLog = true;
        this.isWindow = false;
        this._magic_number = 19;
        this.fileName = 'logger.log';
        if (typeof window !== 'undefined') {
            this.isWindow = true;
        }
        if (typeof fileName === 'string') {
            this.fileName = fileName;
        }
        if (typeof doFileLog === 'boolean') {
            this.doFileLog = doFileLog;
        }
    }
    info(...msg) {
        this.prepareAndSend(call.info, colors.white, msg);
    }
    warn(...msg) {
        this.prepareAndSend(call.warn, colors.yellow, msg);
    }
    trace(...msg) {
        this.prepareAndSend(call.trace, colors.blue, msg);
    }
    error(...msg) {
        this.prepareAndSend(call.error, colors.red, msg);
    }
    success(...msg) {
        this.prepareAndSend(call.success, colors.green, msg);
    }
    prepareAndSend(caller, color, msg) {
        const time = this.getTime();
        const header = `${styles.reset}${styles.bold}${this.isWindow ? '' : color}${time} ${caller}:${styles.reset}`;
        msg.unshift(header);
        if (caller == 'INFO' || caller == 'WARN') {
            console[call[caller]].apply(this, msg);
            this.writeToFile(util_1.default.format.apply(this, msg) + '\n');
        }
        if (caller == 'SUCCESS') {
            console.log.apply(this, msg);
            this.writeToFile(util_1.default.format.apply(this, msg) + '\n');
        }
        if (caller == 'TRACE' || caller == 'ERROR') {
            this.setStack.apply(this, msg);
        }
    }
    getTime() {
        const time = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, this._magic_number);
        return `[${time}]`;
    }
    setStack() {
        const error = new Error;
        const args = [...arguments];
        const header = args.shift();
        const caller = header.includes('ERROR') ? 'error' : 'trace';
        error.name = header;
        Error.captureStackTrace(error, this[caller]);
        if (this.isWindow) {
            error.message = this.arrayToString(args);
            console[caller].call(this, error.stack);
        }
        else {
            error.message = util_1.default.formatWithOptions.apply(this, [{ colors: true }, ...args]);
            console.error.call(this, error.stack);
        }
        this.writeToFile(util_1.default.format.call(this, error.stack) + '\n');
    }
    arrayToString(array) {
        let result = '';
        for (let index = 0; index < array.length; index++) {
            result += JSON.stringify(array[index]) + ' ';
        }
        return result;
    }
    writeToFile(msg) {
        try {
            if (!this.doFileLog || this.isWindow) {
                return;
            }
            msg = msg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
            const fileExists = this.doFileExist();
            if (fileExists) {
                fs_1.default.appendFileSync(this.fileName, msg);
            }
            else {
                fs_1.default.writeFileSync(this.fileName, msg);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    doFileExist() {
        try {
            fs_1.default.accessSync(this.fileName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.default = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsSUFBSyxNQU1KO0FBTkQsV0FBSyxNQUFNO0lBQ1AsNEJBQWdCLENBQUE7SUFDaEIsOEJBQWtCLENBQUE7SUFDbEIsK0JBQW1CLENBQUE7SUFDbkIsNkJBQWlCLENBQUE7SUFDakIsOEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQU5JLE1BQU0sS0FBTixNQUFNLFFBTVY7QUFFRCxJQUFLLE1BR0o7QUFIRCxXQUFLLE1BQU07SUFDUCw2QkFBaUIsQ0FBQTtJQUNqQiw0QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBSEksTUFBTSxLQUFOLE1BQU0sUUFHVjtBQUVELElBQUssSUFNSjtBQU5ELFdBQUssSUFBSTtJQUNMLG9CQUFZLE1BQU0sVUFBQSxDQUFBO0lBQ2xCLG9CQUFZLE1BQU0sVUFBQSxDQUFBO0lBQ2xCLHFCQUFhLE9BQU8sV0FBQSxDQUFBO0lBQ3BCLHFCQUFhLE9BQU8sV0FBQSxDQUFBO0lBQ3BCLHVCQUFlLFNBQVMsYUFBQSxDQUFBO0FBQzVCLENBQUMsRUFOSSxJQUFJLEtBQUosSUFBSSxRQU1SO0FBRUQsTUFBcUIsTUFBTTtJQU92QixZQUFZLFNBQW1CLEVBQUUsUUFBaUI7UUFMakMsY0FBUyxHQUFZLElBQUksQ0FBQztRQUMxQixhQUFRLEdBQVksS0FBSyxDQUFDO1FBQzFCLGtCQUFhLEdBQVcsRUFBRSxDQUFDO1FBQzNCLGFBQVEsR0FBVyxZQUFZLENBQUM7UUFHN0MsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDeEI7UUFDRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztTQUM1QjtRQUNELElBQUksT0FBTyxT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