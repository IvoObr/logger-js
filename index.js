"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
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
        this._fileName = 'logger.log';
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
    get fileName() {
        const date = new Date().toISOString().split('T')[0];
        return `${date}-${this._fileName}`;
    }
    set fileName(fileName) {
        this._fileName = fileName;
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
        msg = this.stringifyObjects(msg);
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
    stringifyObjects(msg) {
        return msg.map((el) => typeof el === 'object' ?
            JSON.stringify(el) : el !== null && el !== void 0 ? el : 'undefined');
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
        const method = this.isWindow ? caller : 'error';
        error.name = header;
        error.message = args.join(' ');
        Error.captureStackTrace(error, this[caller]);
        console[method].call(this, error.stack);
        this.writeToFile(util_1.default.format.call(this, error.stack) + '\n');
    }
    writeToFile(msg) {
        try {
            if (!this.doFileLog || this.isWindow) {
                return;
            }
            msg = msg.replace(/\u001b\[.*?m/g, '');
            if (this.fileExists()) {
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
    fileExists() {
        try {
            fs_1.default.accessSync(this.fileName);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLElBQUssTUFNSjtBQU5ELFdBQUssTUFBTTtJQUNQLDRCQUFnQixDQUFBO0lBQ2hCLDhCQUFrQixDQUFBO0lBQ2xCLCtCQUFtQixDQUFBO0lBQ25CLDZCQUFpQixDQUFBO0lBQ2pCLDhCQUFrQixDQUFBO0FBQ3RCLENBQUMsRUFOSSxNQUFNLEtBQU4sTUFBTSxRQU1WO0FBRUQsSUFBSyxNQUdKO0FBSEQsV0FBSyxNQUFNO0lBQ1AsNkJBQWlCLENBQUE7SUFDakIsNEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQUhJLE1BQU0sS0FBTixNQUFNLFFBR1Y7QUFFRCxJQUFLLElBTUo7QUFORCxXQUFLLElBQUk7SUFDTCxvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQix1QkFBZSxTQUFTLGFBQUEsQ0FBQTtBQUM1QixDQUFDLEVBTkksSUFBSSxLQUFKLElBQUksUUFNUjtBQUVELE1BQWEsTUFBTTtJQWVmLFlBQVksU0FBbUIsRUFBRSxRQUFpQjtRQWRqQyxjQUFTLEdBQVksSUFBSSxDQUFDO1FBQzFCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFDcEMsY0FBUyxHQUFXLFlBQVksQ0FBQztRQVlyQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRTtZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztTQUN4QjtRQUNELElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxPQUFPLFNB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