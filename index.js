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
// #region Enumns
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
    call["info"] = "INFO";
    call["warn"] = "WARN";
    call["trace"] = "TRACE";
    call["error"] = "ERROR";
    call["success"] = "SUCCESS";
})(call || (call = {}));
// #endregion
// #region Classes
class logger {
    constructor() {
        this.logFileName = 'logger-mogger.log';
    }
    info(...msg) {
        const args = [
            colors.white,
            call.info,
            styles.reset,
            ...arguments
        ];
        this.prepareAndSend.apply(this, args);
    }
    warn(...msg) {
        const args = [
            colors.yellow,
            call.warn,
            styles.reset,
            ...arguments
        ];
        this.prepareAndSend.apply(this, args);
    }
    trace(...msg) {
        const args = [
            colors.dim,
            call.trace,
            styles.reset,
            ...arguments
        ];
        this.prepareAndSend.apply(this, args);
    }
    error(...msg) {
        const args = [
            colors.red,
            call.error,
            styles.reset,
            ...arguments
        ];
        this.prepareAndSend.apply(this, args);
    }
    success(...msg) {
        const args = [
            colors.green,
            call.success,
            styles.reset,
            ...arguments
        ];
        this.prepareAndSend.apply(this, args);
    }
    prepareAndSend(...msg) {
        const caller = this.getCaller(msg);
        const time = this.getTime();
        const args = [time, ...arguments];
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
        var error = new Error;
        error.name = 'Trace';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.trace);
        NodeLog.warn(error.stack);
    }
    static error(...msg) {
        var error = new Error;
        error.name = 'Error';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.error);
        NodeLog.warn(error.stack);
    }
    static success(...msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
}
// #endregion
/* Exports */
exports.default = new logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLGdCQUFnQjtBQUNoQixvQkFBb0I7QUFDcEIsaUJBQWlCO0FBQ2pCLGlCQUFpQjtBQUNqQixlQUFlO0FBRWYsaUJBQWlCO0FBQ2pCLElBQUssTUFRSjtBQVJELFdBQUssTUFBTTtJQUNQLDhCQUFrQixDQUFBO0lBQ2xCLDJCQUFlLENBQUE7SUFDZiw0QkFBZ0IsQ0FBQTtJQUNoQiw4QkFBa0IsQ0FBQTtJQUNsQiwrQkFBbUIsQ0FBQTtJQUNuQiw2QkFBaUIsQ0FBQTtJQUNqQiw4QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBUkksTUFBTSxLQUFOLE1BQU0sUUFRVjtBQUVELElBQUssTUFLSjtBQUxELFdBQUssTUFBTTtJQUNQLDZCQUFpQixDQUFBO0lBQ2pCLGtDQUFzQixDQUFBO0lBQ3RCLCtCQUFtQixDQUFBO0lBQ25CLDRCQUFnQixDQUFBO0FBQ3BCLENBQUMsRUFMSSxNQUFNLEtBQU4sTUFBTSxRQUtWO0FBRUQsSUFBSyxJQU1KO0FBTkQsV0FBSyxJQUFJO0lBQ0wscUJBQWEsQ0FBQTtJQUNiLHFCQUFhLENBQUE7SUFDYix1QkFBZSxDQUFBO0lBQ2YsdUJBQWUsQ0FBQTtJQUNmLDJCQUFtQixDQUFBO0FBQ3ZCLENBQUMsRUFOSSxJQUFJLEtBQUosSUFBSSxRQU1SO0FBQ0QsYUFBYTtBQUViLGtCQUFrQjtBQUVsQixNQUFNLE1BQU07SUFBWjtRQUVxQixnQkFBVyxHQUFXLG1CQUFtQixDQUFDO0lBaUgvRCxDQUFDO0lBL0dVLElBQUksQ0FBQyxHQUFHLEdBQVU7UUFDckIsTUFBTSxJQUFJLEdBQVU7WUFDaEIsTUFBTSxDQUFDLEtBQUs7WUFDWixJQUFJLENBQUMsSUFBSTtZQUNULE1BQU0sQ0FBQyxLQUFLO1lBQ1osR0FBRyxTQUFTO1NBQ2YsQ0FBQztR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