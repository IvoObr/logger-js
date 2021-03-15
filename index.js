"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
class logger {
    constructor(options) {
        this.logFileName = 'logger.log';
        this.writeInFile = true;
        if (typeof (options === null || options === void 0 ? void 0 : options.logFileName) === 'string') {
            this.logFileName = options === null || options === void 0 ? void 0 : options.logFileName;
        }
        if (typeof (options === null || options === void 0 ? void 0 : options.writeInFile) === 'boolean') {
            this.writeInFile = options === null || options === void 0 ? void 0 : options.writeInFile;
        }
    }
    inspect(msg) {
        msg = util_1.default.inspect(msg);
        this.printLog(msg, {
            color: 'dim',
            prefix: 'INSPECT: '
        });
    }
    info(msg) {
        this.printLog(msg, {
            color: 'white',
            prefix: 'INFO:    '
        });
    }
    success(msg) {
        this.printLog(msg, {
            color: 'green',
            prefix: 'SUCCESS: '
        });
    }
    warn(msg) {
        this.printLog(msg, {
            color: 'yellow',
            prefix: 'WARNING: '
        });
    }
    error(msg) {
        // msg = util.inspect(msg);
        this.printLog(msg, {
            color: 'red',
            prefix: 'ERROR:   '
        });
    }
    printLog(msg, level) {
        const time = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';
        const colorFn = colors_1.default[level.color];
        console.log(`${time} ${colorFn(level.prefix).bold} ${colorFn(msg)}`);
        if (this.writeInFile) {
            this.writeToFile(`${time} ${level.prefix}: ${msg += '\r\n'}`);
        }
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
//# sourceMappingURL=index.js.map