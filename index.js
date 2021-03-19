"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
// todo readme
// todo test all
// todo bump version
// todo bold !!! 
// todo namespace
// todo rainbow
// todo remove duplicate code
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
    styles["bold"] = "\x0033[0m";
})(styles || (styles = {}));
var call;
(function (call) {
    call["info"] = "INFO:";
    call["warn"] = "WARN:";
    call["trace"] = "TRACE:";
    call["error"] = "ERROR:";
    call["success"] = "SUCCESS:";
})(call || (call = {}));
class logger {
    constructor() {
        this.logFileName = 'logger-mogger.log';
    }
    info(...msg) {
        const args = [
            colors.white,
            call.info,
            ...arguments,
            styles.reset
        ];
        this.prepareAndSend.apply(this, args);
    }
    warn(...msg) {
        const args = [
            colors.yellow,
            call.warn,
            ...arguments,
            styles.reset
        ];
        this.prepareAndSend.apply(this, args);
    }
    trace(...msg) {
        const args = [
            colors.dim,
            call.trace,
            ...arguments,
            styles.reset
        ];
        this.prepareAndSend.apply(this, args);
    }
    error(...msg) {
        const args = [
            colors.red,
            call.error,
            ...arguments,
            styles.reset
        ];
        this.prepareAndSend.apply(this, args);
    }
    success(...msg) {
        const args = [
            colors.green,
            call.success,
            ...arguments,
            styles.reset
        ];
        this.prepareAndSend.apply(this, args);
    }
    prepareAndSend(...msg) {
        const caller = this.getCaller(msg);
        const time = this.getTime();
        const args = [...arguments];
        args.splice(1, 0, time);
        if (typeof process !== 'undefined') {
            NodeLog[caller].apply(this, args);
            this.writeToFile(util_1.default.format.apply(this, args) + '\n');
        }
        if (typeof window !== 'undefined') {
            BrowserLog[caller].apply(this, args);
        }
    }
    getTime() {
        const time = new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19);
        return `[${time}]`;
    }
    getCaller(msg) {
        return msg
            .splice(1, 1)[0]
            .toLowerCase();
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
class BrowserLog {
    static info(...msg) {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    static warn(...msg) {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }
    static trace(...msg) {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }
    static error(...msg) {
        console.error(console.error.apply(this, arguments) + '\n');
    }
    static success(...msg) {
        console.log(console.log.apply(this, arguments) + '\n');
    }
}
class NodeLog {
    static info(...msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    static warn(...msg) {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    static trace(...msg) {
        const error = new Error;
        const args = [...arguments];
        const time = args.splice(0, 1)[0];
        error.name = time;
        error.message = util_1.default.format.apply(this, args);
        Error.captureStackTrace(error, this.trace);
        // console.log(error.stack.split(' '));
        NodeLog.warn(error.stack.replace(':', ''));
    }
    static error(...msg) {
        const error = new Error;
        const args = [...arguments];
        const time = args.splice(0, 1)[0];
        error.name = time;
        error.message = util_1.default.format.apply(this, args);
        Error.captureStackTrace(error, this.error);
        NodeLog.warn(error.stack.replace(':', ''));
    }
    static success(...msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
}
exports.default = new logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLGdCQUFnQjtBQUNoQixvQkFBb0I7QUFDcEIsaUJBQWlCO0FBQ2pCLGlCQUFpQjtBQUNqQixlQUFlO0FBQ2YsNkJBQTZCO0FBRTdCLElBQUssTUFRSjtBQVJELFdBQUssTUFBTTtJQUNQLDhCQUFrQixDQUFBO0lBQ2xCLDJCQUFlLENBQUE7SUFDZiw0QkFBZ0IsQ0FBQTtJQUNoQiw4QkFBa0IsQ0FBQTtJQUNsQiwrQkFBbUIsQ0FBQTtJQUNuQiw2QkFBaUIsQ0FBQTtJQUNqQiw4QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBUkksTUFBTSxLQUFOLE1BQU0sUUFRVjtBQUVELElBQUssTUFLSjtBQUxELFdBQUssTUFBTTtJQUNQLDZCQUFpQixDQUFBO0lBQ2pCLGtDQUFzQixDQUFBO0lBQ3RCLCtCQUFtQixDQUFBO0lBQ25CLDRCQUFnQixDQUFBO0FBQ3BCLENBQUMsRUFMSSxNQUFNLEtBQU4sTUFBTSxRQUtWO0FBRUQsSUFBSyxJQU1KO0FBTkQsV0FBSyxJQUFJO0lBQ0wsc0JBQWMsQ0FBQTtJQUNkLHNCQUFjLENBQUE7SUFDZCx3QkFBZ0IsQ0FBQTtJQUNoQix3QkFBZ0IsQ0FBQTtJQUNoQiw0QkFBb0IsQ0FBQTtBQUN4QixDQUFDLEVBTkksSUFBSSxLQUFKLElBQUksUUFNUjtBQUVELE1BQU0sTUFBTTtJQUFaO1FBRXFCLGdCQUFXLEdBQVcsbUJBQW1CLENBQUM7SUFrSC9ELENBQUM7SUFoSFUsSUFBSSxDQUFDLEdBQUcsR0FBVTtRQUNyQixNQUFNLElBQUksR0FBVTtZQUNoQixNQUFNLENBQUMsS0FBSztZQUNaLElBQUksQ0FBQyxJQUFJO1lBQ1QsR0FBRyxTQUFTO1lBQ1osTUFBTSxDQUFDLEtBQUs7U0FDZixDQUFDO1FBRUYsSUFBSSxDQUFDLGNBQWMs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