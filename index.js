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
// todo local date
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
var mapColors;
(function (mapColors) {
    mapColors[mapColors["INFO"] = colors.white] = "INFO";
    mapColors[mapColors["WARN"] = colors.yellow] = "WARN";
    mapColors[mapColors["TRACE"] = colors.blue] = "TRACE";
    mapColors[mapColors["ERROR"] = colors.red] = "ERROR";
    mapColors[mapColors["SUCCESS"] = colors.green] = "SUCCESS";
})(mapColors || (mapColors = {}));
class Logger {
    constructor(doFileLog, fileName) {
        this.magic_number = 19;
        if (typeof doFileLog === 'boolean') {
            NodeLog.doFileLog = doFileLog;
        }
        if (typeof fileName === 'string') {
            NodeLog.fileName = fileName;
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
        const color = mapColors[caller];
        const header = `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}`;
        args.unshift(header);
        if (typeof process !== 'undefined') {
            NodeLog[call[caller]].apply(this, args);
        }
        if (typeof window !== 'undefined') {
            BrowserLog[call[caller]].apply(this, args);
        }
    }
    getTime() {
        const time = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, this.magic_number);
        return `[${time}]`;
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
class NodeLog {
    static info(msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
        NodeLog.writeToFile(util_1.default.format.apply(this, arguments) + '\n');
    }
    static warn() {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
        NodeLog.writeToFile(util_1.default.format.apply(this, arguments) + '\n');
    }
    static trace() {
        NodeLog.setStack.apply(this, arguments);
    }
    static error() {
        NodeLog.setStack.apply(this, arguments);
    }
    static success() {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
        NodeLog.writeToFile(util_1.default.format.apply(this, arguments) + '\n');
    }
    static setStack() {
        const error = new Error;
        const args = [...arguments];
        const header = args.shift();
        const caller = (header.indexOf('ERROR') > -1) ? 'error' : 'trace';
        error.name = header;
        error.message = util_1.default.format.apply(this, args);
        Error.captureStackTrace(error, this[caller]);
        NodeLog.warn.call(this, error.stack);
    }
    static writeToFile(msg) {
        try {
            if (!NodeLog.doFileLog) {
                return;
            }
            const fileExists = this.doFileExist();
            if (fileExists) {
                fs_1.default.appendFileSync(NodeLog.fileName, msg);
            }
            else {
                fs_1.default.writeFileSync(NodeLog.fileName, msg);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    static doFileExist() {
        try {
            fs_1.default.accessSync(NodeLog.fileName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
NodeLog.doFileLog = true;
NodeLog.fileName = 'logger.log';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLGdCQUFnQjtBQUNoQixlQUFlO0FBQ2Ysa0JBQWtCO0FBRWxCLElBQUssTUFRSjtBQVJELFdBQUssTUFBTTtJQUNQLDhCQUFrQixDQUFBO0lBQ2xCLDJCQUFlLENBQUE7SUFDZiw0QkFBZ0IsQ0FBQTtJQUNoQiw4QkFBa0IsQ0FBQTtJQUNsQiwrQkFBbUIsQ0FBQTtJQUNuQiw2QkFBaUIsQ0FBQTtJQUNqQiw4QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBUkksTUFBTSxLQUFOLE1BQU0sUUFRVjtBQUVELElBQUssTUFLSjtBQUxELFdBQUssTUFBTTtJQUNQLDZCQUFpQixDQUFBO0lBQ2pCLGtDQUFzQixDQUFBO0lBQ3RCLCtCQUFtQixDQUFBO0lBQ25CLDRCQUFrQixDQUFBO0FBQ3RCLENBQUMsRUFMSSxNQUFNLEtBQU4sTUFBTSxRQUtWO0FBRUQsSUFBSyxJQU1KO0FBTkQsV0FBSyxJQUFJO0lBQ0wsb0JBQVksTUFBTSxVQUFBLENBQUE7SUFDbEIsb0JBQVksTUFBTSxVQUFBLENBQUE7SUFDbEIscUJBQWEsT0FBTyxXQUFBLENBQUE7SUFDcEIscUJBQWEsT0FBTyxXQUFBLENBQUE7SUFDcEIsdUJBQWUsU0FBUyxhQUFBLENBQUE7QUFDNUIsQ0FBQyxFQU5JLElBQUksS0FBSixJQUFJLFFBTVI7QUFFRCxJQUFLLFNBTUo7QUFORCxXQUFLLFNBQVM7SUFDViw4QkFBWSxNQUFNLENBQUMsS0FBSyxVQUFBLENBQUE7SUFDeEIsOEJBQVksTUFBTSxDQUFDLE1BQU0sVUFBQSxDQUFBO0lBQ3pCLCtCQUFhLE1BQU0sQ0FBQyxJQUFJLFdBQUEsQ0FBQTtJQUN4QiwrQkFBYSxNQUFNLENBQUMsR0FBRyxXQUFBLENBQUE7SUFDdkIsaUNBQWUsTUFBTSxDQUFDLEtBQUss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