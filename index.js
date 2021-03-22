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
// todo custom file name
// todo remove ts-node!!!
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
class Log {
}
class Logger extends Log {
    constructor(doFileLog, fileName) {
        super();
        this.magic_number = 19;
        this.nodeLog = new NodeLog(doFileLog, fileName);
        this.browserLog = new BrowserLog();
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
        const header = `${styles.reset}${styles.bold}${color}${time} ${caller}:${styles.reset}${color}`;
        args.unshift(header);
        if (typeof process !== 'undefined') {
            this.nodeLog[call[caller]].apply(this, args);
        }
        if (typeof window !== 'undefined') {
            this.browserLog[call[caller]].apply(this, args);
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
class BrowserLog extends Log {
    info() {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    warn() {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }
    trace() {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }
    error() {
        console.error(console.error.apply(this, arguments) + '\n');
    }
    success() {
        console.log(console.log.apply(this, arguments) + '\n');
    }
}
class NodeLog extends Log {
    constructor(doFileLog = true, fileName = 'logger.log') {
        super();
        this.doFileLog = doFileLog;
        this.fileName = fileName;
        this.nodeLog = this;
    }
    info() {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
        this.nodeLog.writeToFile(util_1.default.format.apply(this, arguments) + '\n');
    }
    warn() {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
        this.nodeLog.writeToFile(util_1.default.format.apply(this, arguments) + '\n');
    }
    trace() {
        this.nodeLog.setStack.apply(this, arguments);
    }
    error() {
        this.nodeLog.setStack.apply(this, arguments);
    }
    success() {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
        this.nodeLog.writeToFile(util_1.default.format.apply(this, arguments) + '\n');
    }
    setStack() {
        const error = new Error;
        const args = [...arguments];
        const header = args.shift();
        const caller = (header.indexOf('ERROR') > -1) ? 'error' : 'trace';
        error.name = header;
        error.message = util_1.default.format.apply(this, args);
        Error.captureStackTrace(error, this[caller]);
        this.nodeLog.warn.call(this, error.stack);
    }
    writeToFile(msg) {
        try {
            if (!this.nodeLog.doFileLog) {
                return;
            }
            const fileExists = this.doFileExist();
            if (fileExists) {
                fs_1.default.appendFileSync(this.nodeLog.fileName, msg);
            }
            else {
                fs_1.default.writeFileSync(this.nodeLog.fileName, msg);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    doFileExist() {
        try {
            fs_1.default.accessSync(this.nodeLog.fileName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLGdCQUFnQjtBQUNoQixlQUFlO0FBQ2Ysd0JBQXdCO0FBQ3hCLHlCQUF5QjtBQUV6QixJQUFLLE1BUUo7QUFSRCxXQUFLLE1BQU07SUFDUCw4QkFBa0IsQ0FBQTtJQUNsQiwyQkFBZSxDQUFBO0lBQ2YsNEJBQWdCLENBQUE7SUFDaEIsOEJBQWtCLENBQUE7SUFDbEIsK0JBQW1CLENBQUE7SUFDbkIsNkJBQWlCLENBQUE7SUFDakIsOEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQVJJLE1BQU0sS0FBTixNQUFNLFFBUVY7QUFFRCxJQUFLLE1BS0o7QUFMRCxXQUFLLE1BQU07SUFDUCw2QkFBaUIsQ0FBQTtJQUNqQixrQ0FBc0IsQ0FBQTtJQUN0QiwrQkFBbUIsQ0FBQTtJQUNuQiw0QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBTEksTUFBTSxLQUFOLE1BQU0sUUFLVjtBQUVELElBQUssSUFNSjtBQU5ELFdBQUssSUFBSTtJQUNMLG9CQUFZLE1BQU0sVUFBQSxDQUFBO0lBQ2xCLG9CQUFZLE1BQU0sVUFBQSxDQUFBO0lBQ2xCLHFCQUFhLE9BQU8sV0FBQSxDQUFBO0lBQ3BCLHFCQUFhLE9BQU8sV0FBQSxDQUFBO0lBQ3BCLHVCQUFlLFNBQVMsYUFBQSxDQUFBO0FBQzVCLENBQUMsRUFOSSxJQUFJLEtBQUosSUFBSSxRQU1SO0FBRUQsSUFBSyxTQU1KO0FBTkQsV0FBSyxTQUFTO0lBQ1YsOEJBQVksTUFBTSxDQUFDLEtBQUssVUFBQSxDQUFBO0lBQ3hCLDhCQUFZLE1BQU0sQ0FBQyxNQUFNLFVBQUEsQ0FBQTtJQUN6QiwrQkFBYSxNQUFNLENBQUMsSUFBSSxXQUFBLENBQUE7SUFDeEIsK0JBQWEsTUFBTSxDQUFDLEdBQUcsV0FBQSxDQUFBO0lBQ3ZCLGlDQUFlLE1B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