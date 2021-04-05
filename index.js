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
    constructor(options) {
        this._fileName = 'logger.log';
        this.useColor = true;
        this.logInFile = true;
        this.isWindow = false;
        this._magic_number = 19;
        if (typeof window !== 'undefined') {
            this.isWindow = true;
        }
        if (typeof (options === null || options === void 0 ? void 0 : options.fileName) === 'string') {
            this.fileName = options.fileName;
        }
        if (typeof (options === null || options === void 0 ? void 0 : options.logInFile) === 'boolean') {
            this.logInFile = options.logInFile;
        }
        if (typeof (options === null || options === void 0 ? void 0 : options.useColor) === 'boolean') {
            this.useColor = options.useColor;
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
        const header = `${styles.reset}${styles.bold}${this.useColor ? color : ''}${time} ${caller}:${styles.reset}`;
        msg.unshift(header);
        msg = this.stringifyObjects(msg);
        if (caller == 'INFO' || caller == 'WARN' || caller == 'ERROR') {
            console[call[caller]].apply(this, msg);
            this.writeToFile(util_1.default.format.apply(this, msg) + '\n');
        }
        if (caller == 'SUCCESS') {
            console.log.apply(this, msg);
            this.writeToFile(util_1.default.format.apply(this, msg) + '\n');
        }
        if (caller == 'TRACE') {
            this.setStack.apply(this, msg);
        }
    }
    stringifyObjects(msg) {
        return msg.map((el) => ((el === null || el === void 0 ? void 0 : el.constructor) === Object) ? JSON.stringify(el) : el);
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
        error.name = header;
        error.message = args.join(' ');
        Error.captureStackTrace(error, this.trace);
        console.trace.call(this, error.stack);
        this.writeToFile(util_1.default.format.call(this, error.stack) + '\n');
    }
    writeToFile(msg) {
        try {
            if (!this.logInFile || this.isWindow) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLElBQUssTUFNSjtBQU5ELFdBQUssTUFBTTtJQUNQLDRCQUFnQixDQUFBO0lBQ2hCLDhCQUFrQixDQUFBO0lBQ2xCLCtCQUFtQixDQUFBO0lBQ25CLDZCQUFpQixDQUFBO0lBQ2pCLDhCQUFrQixDQUFBO0FBQ3RCLENBQUMsRUFOSSxNQUFNLEtBQU4sTUFBTSxRQU1WO0FBRUQsSUFBSyxNQUdKO0FBSEQsV0FBSyxNQUFNO0lBQ1AsNkJBQWlCLENBQUE7SUFDakIsNEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQUhJLE1BQU0sS0FBTixNQUFNLFFBR1Y7QUFFRCxJQUFLLElBTUo7QUFORCxXQUFLLElBQUk7SUFDTCxvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQix1QkFBZSxTQUFTLGFBQUEsQ0FBQTtBQUM1QixDQUFDLEVBTkksSUFBSSxLQUFKLElBQUksUUFNUjtBQVFELE1BQWEsTUFBTTtJQWlCZixZQUFZLE9BQXFCO1FBZnpCLGNBQVMsR0FBVyxZQUFZLENBQUM7UUFDeEIsYUFBUSxHQUFZLElBQUksQ0FBQztRQUN6QixjQUFTLEdBQVksSUFBSSxDQUFDO1FBQzFCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFZeEMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDeEI7UUFDRCxJQUFJLE9BQU8sQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsUUFBUSxDQUFBLEtBQUssUUFBUSxFQUFFO1lB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