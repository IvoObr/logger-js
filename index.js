"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
// todo readme
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
        this.prepareAndSend(call.info, ...msg);
    }
    warn(...msg) {
        this.prepareAndSend(call.warn, ...msg);
    }
    trace(...msg) {
        this.prepareAndSend(call.trace, ...msg);
    }
    error(...msg) {
        this.prepareAndSend(call.error, ...msg);
    }
    success(...msg) {
        this.prepareAndSend(call.success, ...msg);
    }
    prepareAndSend(...msg) {
        // const args: any[] = [...arguments];
        const caller = msg.shift();
        const time = this.getTime();
        const color = colorsMap[caller];
        const header = this.isWindow ?
            `${styles.reset}${styles.bold}${time} ${caller}:${styles.reset}`
            : `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}`;
        msg.unshift(header);
        if (logMap[caller] === 'log' || logMap[caller] === 'warn') {
            console[logMap[caller]].apply(this, msg);
            this.writeToFile(util_1.default.format.apply(this, msg) + '\n');
        }
        if (logMap[caller] === 'trace' || logMap[caller] === 'error') {
            this.setStack.apply(this, msg);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUVkLElBQUssTUFRSjtBQVJELFdBQUssTUFBTTtJQUNQLDhCQUFrQixDQUFBO0lBQ2xCLDJCQUFlLENBQUE7SUFDZiw0QkFBZ0IsQ0FBQTtJQUNoQiw4QkFBa0IsQ0FBQTtJQUNsQiwrQkFBbUIsQ0FBQTtJQUNuQiw2QkFBaUIsQ0FBQTtJQUNqQiw4QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBUkksTUFBTSxLQUFOLE1BQU0sUUFRVjtBQUVELElBQUssTUFLSjtBQUxELFdBQUssTUFBTTtJQUNQLDZCQUFpQixDQUFBO0lBQ2pCLGtDQUFzQixDQUFBO0lBQ3RCLCtCQUFtQixDQUFBO0lBQ25CLDRCQUFrQixDQUFBO0FBQ3RCLENBQUMsRUFMSSxNQUFNLEtBQU4sTUFBTSxRQUtWO0FBRUQsSUFBSyxJQU1KO0FBTkQsV0FBSyxJQUFJO0lBQ0wsb0JBQVksTUFBTSxVQUFBLENBQUE7SUFDbEIsb0JBQVksTUFBTSxVQUFBLENBQUE7SUFDbEIscUJBQWEsT0FBTyxXQUFBLENBQUE7SUFDcEIscUJBQWEsT0FBTyxXQUFBLENBQUE7SUFDcEIsdUJBQWUsU0FBUyxhQUFBLENBQUE7QUFDNUIsQ0FBQyxFQU5JLElBQUksS0FBSixJQUFJLFFBTVI7QUFFRCxJQUFLLFNBTUo7QUFORCxXQUFLLFNBQVM7SUFDViw4QkFBWSxNQUFNLENBQUMsS0FBSyxVQUFBLENBQUE7SUFDeEIsOEJBQVksTUFBTSxDQUFDLE1BQU0sVUFBQSxDQUFBO0lBQ3pCLCtCQUFhLE1BQU0sQ0FBQyxJQUFJLFdBQUEsQ0FBQTtJQUN4QiwrQkFBYSxNQUFNLENBQUMsR0FBRyxXQUFBLENBQUE7SUFDdkIsaUNBQWUsTUFBTSxDQUFDLEtBQUssYUFBQSxDQUFBO0FBQy9CLENBQUMsRUFOSSxTQUFTLEtBQVQs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