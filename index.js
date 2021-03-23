"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
// todo readme
// todo test all
// todo rainbow
var colors;
(function (colors) {
    colors["bright"] = "\u001B[1m";
    colors["dim"] = "\u001B[2m";
    colors["red"] = "\u001B[31m";
    colors["green"] = "\u001B[32m";
    colors["yellow"] = "\u001B[33m";
    colors["blue"] = "\u001B[34m";
    colors["white"] = "\u001B[37m";
})(colors || (colors = {}));
var styles;
(function (styles) {
    styles["reset"] = "\u001B[0m";
    styles["underscore"] = "\u001B[4m";
    styles["reverse"] = "\u001B[7m";
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
var colorsMap;
(function (colorsMap) {
    colorsMap[colorsMap["INFO"] = colors.white] = "INFO";
    colorsMap[colorsMap["WARN"] = colors.yellow] = "WARN";
    colorsMap[colorsMap["TRACE"] = colors.blue] = "TRACE";
    colorsMap[colorsMap["ERROR"] = colors.red] = "ERROR";
    colorsMap[colorsMap["SUCCESS"] = colors.green] = "SUCCESS";
})(colorsMap || (colorsMap = {}));
var logMap;
(function (logMap) {
    logMap["INFO"] = "log";
    logMap["WARN"] = "warn";
    logMap["TRACE"] = "trace";
    logMap["ERROR"] = "error";
    logMap["SUCCESS"] = "log";
})(logMap || (logMap = {}));
class Logger {
    constructor(doFileLog, fileName) {
        this.doFileLog = true;
        this.fileName = 'logger.log';
        this.magic_number = 19;
        this.isWindow = false;
        if (typeof doFileLog === 'boolean') {
            this.doFileLog = doFileLog;
        }
        if (typeof window !== 'undefined') {
            this.isWindow = true;
        }
        if (typeof fileName === 'string') {
            this.fileName = fileName;
        }
    }
    info(...msg) {
        const args = [call.info, ...arguments];
        this.prepareAndSend.apply(this, args);
    }
    warn(...msg) {
        const args = [call.warn, ...arguments];
        this.prepareAndSend.apply(this, args);
    }
    trace(...msg) {
        const args = [call.trace, ...arguments];
        this.prepareAndSend.apply(this, args);
    }
    error(...msg) {
        const args = [call.error, ...arguments];
        this.prepareAndSend.apply(this, args);
    }
    success(...msg) {
        const args = [call.success, ...arguments];
        this.prepareAndSend.apply(this, args);
    }
    prepareAndSend() {
        const args = [...arguments];
        const caller = args.shift();
        const time = this.getTime();
        const color = colorsMap[caller];
        const header = this.isWindow ?
            `${styles.reset}${styles.bold}${time} ${caller}:${styles.reset}`
            : `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}`;
        args.unshift(header);
        if (logMap[caller] === 'log' || logMap[caller] === 'warn') {
            console[logMap[caller]].apply(this, args);
            this.writeToFile(util_1.default.format.apply(this, args) + '\n');
        }
        if (logMap[caller] === 'trace' || logMap[caller] === 'error') {
            this.setStack.apply(this, args);
        }
    }
    getTime() {
        const time = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, this.magic_number);
        return `[${time}]`;
    }
    setStack() {
        var _a;
        const error = new Error;
        const args = [...arguments];
        const header = args.shift();
        const caller = (header.indexOf('ERROR') > -1) ? 'error' : 'trace';
        error.name = header;
        error.message = ((_a = util_1.default === null || util_1.default === void 0 ? void 0 : util_1.default.formatWithOptions) === null || _a === void 0 ? void 0 : _a.apply(this, [{ colors: true }, ...args]))
            || this.arrayToString(args);
        Error.captureStackTrace(error, this[caller]);
        console.warn.call(this, error.stack);
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
class BrowserLog {
    static info() {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    static warn() {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }
    static trace() {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }
    static error() {
        console.error(console.error.apply(this, arguments) + '\n');
    }
    static success() {
        console.log(console.log.apply(this, arguments) + '\n');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLGdCQUFnQjtBQUNoQixlQUFlO0FBRWYsSUFBSyxNQVFKO0FBUkQsV0FBSyxNQUFNO0lBQ1AsOEJBQWtCLENBQUE7SUFDbEIsMkJBQWUsQ0FBQTtJQUNmLDRCQUFnQixDQUFBO0lBQ2hCLDhCQUFrQixDQUFBO0lBQ2xCLCtCQUFtQixDQUFBO0lBQ25CLDZCQUFpQixDQUFBO0lBQ2pCLDhCQUFrQixDQUFBO0FBQ3RCLENBQUMsRUFSSSxNQUFNLEtBQU4sTUFBTSxRQVFWO0FBRUQsSUFBSyxNQUtKO0FBTEQsV0FBSyxNQUFNO0lBQ1AsNkJBQWlCLENBQUE7SUFDakIsa0NBQXNCLENBQUE7SUFDdEIsK0JBQW1CLENBQUE7SUFDbkIsNEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQUxJLE1BQU0sS0FBTixNQUFNLFFBS1Y7QUFFRCxJQUFLLElBTUo7QUFORCxXQUFLLElBQUk7SUFDTCxvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQix1QkFBZSxTQUFTLGFBQUEsQ0FBQTtBQUM1QixDQUFDLEVBTkksSUFBSSxLQUFKLElBQUksUUFNUjtBQUVELElBQUssU0FNSjtBQU5ELFdBQUssU0FBUztJQUNWLDhCQUFZLE1BQU0sQ0FBQyxLQUFLLFVBQUEsQ0FBQTtJQUN4Qiw4QkFBWSxNQUFNLENBQUMsTUFBTSxVQUFBLENBQUE7SUFDekIsK0JBQWEsTUFBTSxDQUFDLElBQUksV0FBQSxDQUFBO0lBQ3hCLCtCQUFhLE1BQU0sQ0FBQyxHQUFHLFdBQUEsQ0FBQTtJQUN2QixpQ0FBZSxNQUFNLENBQUMsS0FBSyxhQUFBLENBQUE7QUFD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