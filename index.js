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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsSUFBSyxNQU1KO0FBTkQsV0FBSyxNQUFNO0lBQ1AsNEJBQWdCLENBQUE7SUFDaEIsOEJBQWtCLENBQUE7SUFDbEIsK0JBQW1CLENBQUE7SUFDbkIsNkJBQWlCLENBQUE7SUFDakIsOEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQU5JLE1BQU0sS0FBTixNQUFNLFFBTVY7QUFFRCxJQUFLLE1BR0o7QUFIRCxXQUFLLE1BQU07SUFDUCw2QkFBaUIsQ0FBQTtJQUNqQiw0QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBSEksTUFBTSxLQUFOLE1BQU0sUUFHVjtBQUVELElBQUssSUFNSjtBQU5ELFdBQUssSUFBSTtJQUNMLG9CQUFZLE1BQU0sVUFBQSxDQUFBO0lBQ2xCLG9CQUFZLE1BQU0sVUFBQSxDQUFBO0lBQ2xCLHFCQUFhLE9BQU8sV0FBQSxDQUFBO0lBQ3BCLHFCQUFhLE9BQU8sV0FBQSxDQUFBO0lBQ3BCLHVCQUFlLFNBQVMsYUFBQSxDQUFBO0FBQzVCLENBQUMsRUFOSSxJQUFJLEtBQUosSUFBSSxRQU1SO0FBRUQsTUFBcUIsTUFBTTtJQWdCdkIsWUFBWSxTQUFtQixFQUFFLFFBQWlCO1FBZGpDLGNBQVMsR0FBWSxJQUFJLENBQUM7UUFDMUIsYUFBUSxHQUFZLEtBQUssQ0FBQztRQUMxQixrQkFBYSxHQUFXLEVBQUUsQ0FBQztRQUNwQyxjQUFTLEdBQVcsWUFBWSxDQUFDO1FBWXJDLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO1FBQ0QsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDNUI7UUFDRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztTQUM5QjtJQUNMLENBQUM7SUFuQkQsSUFBSSxRQUFRO1FBQ1IsTUFBTSxJQUFJLEdBQVcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDM0QsT0FBTyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUksUUFBUSxDQUFDLFFBQWdCO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzlCLENBQUM7SUFjTSxJQUFJLENBQUMsR0FBRyxHQUFVO1FBQ3JCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFTSxJQUFJLENBQUMsR0FBRyxHQUFVO1FBQ3JCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxHQUFVO1FBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3JELENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxHQUFVO1FBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFTSxPQUFPLENBQUMsR0FBRyxHQUFVO1FBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3hELENBQUM7SUFFTyxjQUFjLENBQUMsTUFBVyxFQUFFLEtBQWEsRUFBRSxHQUFVO1FBQ3pELE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwQyxNQUFNLE1BQU0sR0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNySCxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXBCLElBQUksTUFBTSxJQUFJLE1BQU0sSUFBSSxNQUFNLElBQUksTUFBTSxFQUFFO1lBQ3JDLE9BQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxXQUFXLENBQUMsY0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1NBQ2hFO1FBRUQsSUFBSSxNQUFNLElBQUksU0FBUyxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLGNBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUNoRTtRQUVELElBQUksTUFBTSxJQUFJLE9BQU8sSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQ3ZDLElBQUksQ0FBQyxRQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDM0M7SUFDTCxDQUFDO0lBRU8sT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFXLElBQUksSUFBSSxFQUFFO2FBQzFCLFdBQVcsRUFBRTthQUNiLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQ2pCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXRDLE9BQU8sSUFBSSxJQUFJLEdBQUcsQ0FBQztJQUN2QixDQUFDO0lBRU8sUUFBUTtRQUNaLE1BQU0sS0FBSyxHQUFVLElBQUksS0FBSyxDQUFDO1FBQy9CLE1BQU0sSUFBSSxHQUFVLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBVyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQVcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDcEUsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDcEIsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRyxJQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUV0RCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDZixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEMsT0FBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BEO2FBQU07WUFDSCxLQUFLLENBQUMsT0FBTyxHQUFJLGNBQUksQ0FBQyxpQkFBeUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLE9BQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbEQ7UUFFRCxJQUFJLENBQUMsV0FBVyxDQUFFLGNBQUksQ0FBQyxNQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVPLGFBQWEsQ0FBQyxLQUFZO1FBQzlCLElBQUksTUFBTSxHQUFXLEVBQUUsQ0FBQztRQUV4QixLQUFLLElBQUksS0FBSyxHQUFXLENBQUMsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUN2RCxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDaEQ7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRU8sV0FBVyxDQUFDLEdBQVc7UUFDM0IsSUFBSTtZQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xDLE9BQU87YUFDVjtZQUNELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLDZFQUE2RSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JHLE1BQU0sVUFBVSxHQUFZLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUUvQyxJQUFJLFVBQVUsRUFBRTtnQkFDWixZQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFFekM7aUJBQU07Z0JBQ0gsWUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ3hDO1NBRUo7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDeEI7SUFDTCxDQUFDO0lBRU8sV0FBVztRQUNmLElBQUk7WUFDQSxZQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3QixPQUFPLElBQUksQ0FBQztTQUVmO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLEtBQUssQ0FBQztTQUNoQjtJQUNMLENBQUM7Q0FDSjtBQXRJRCx5QkFzSUMifQ==