"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
// todo readme
// todo rename library to just logger
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
    }
    success(...msg) {
        const args = [
            colors.green,
            call.success,
            styles.reset,
            ...arguments
        ];
    }
    infoNode(...msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    warnNode() {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    traceNode(...msg) {
        var error = new Error;
        error.name = 'Trace';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.traceNode);
        this.error(error.stack);
    }
    errorNode(...msg) {
        var error = new Error;
        error.name = 'Error';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.errorNode);
        this.error(error.stack);
    }
    successNode(...msg) {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    infoBrowser(...msg) {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    warnBrowser(...msg) {
        console.warn(console.warn.apply(this, arguments) + '\n');
    }
    traceBrowser(...msg) {
        console.trace(console.trace.apply(this, arguments) + '\n');
    }
    errorBrowser(...msg) {
        console.error(console.error.apply(this, arguments) + '\n');
    }
    successBrowser(...msg) {
        console.log(console.log.apply(this, arguments) + '\n');
    }
    prepareAndSend(...msg) {
        const caller = this.getCaller(msg);
        const time = this.getTime();
        const args = [time, ...arguments];
        if (typeof process !== 'undefined') {
            this[caller + 'Node'].apply(this, args);
            this.writeToFile(util_1.default.format.apply(this, args) + '\n');
        }
        if (typeof window !== 'undefined') {
            this[caller + 'Browser'].apply(this, args);
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
exports.default = new logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLHFDQUFxQztBQUVyQyxJQUFLLE1BUUo7QUFSRCxXQUFLLE1BQU07SUFDUCw4QkFBa0IsQ0FBQTtJQUNsQiwyQkFBZSxDQUFBO0lBQ2YsNEJBQWdCLENBQUE7SUFDaEIsOEJBQWtCLENBQUE7SUFDbEIsK0JBQW1CLENBQUE7SUFDbkIsNkJBQWlCLENBQUE7SUFDakIsOEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQVJJLE1BQU0sS0FBTixNQUFNLFFBUVY7QUFFRCxJQUFLLE1BS0o7QUFMRCxXQUFLLE1BQU07SUFDUCw2QkFBaUIsQ0FBQTtJQUNqQixrQ0FBc0IsQ0FBQTtJQUN0QiwrQkFBbUIsQ0FBQTtJQUNuQiw0QkFBZ0IsQ0FBQTtBQUNwQixDQUFDLEVBTEksTUFBTSxLQUFOLE1BQU0sUUFLVjtBQUVELElBQUssSUFNSjtBQU5ELFdBQUssSUFBSTtJQUNMLHFCQUFhLENBQUE7SUFDYixxQkFBYSxDQUFBO0lBQ2IsdUJBQWUsQ0FBQTtJQUNmLHVCQUFlLENBQUE7SUFDZiwyQkFBbUIsQ0FBQTtBQUN2QixDQUFDLEVBTkksSUFBSSxLQUFKLElBQUksUUFNUjtBQVNELE1BQU0sTUFBTTtJQUFaO1FBRVksZ0JBQVcsR0FBVyxtQkFBbUIsQ0FBQztJQTZKdEQsQ0FBQztJQTNKVSxJQUFJLENBQUMsR0FBRyxHQUFRO1FBQ25CLE1BQU0sSUFBSSxHQUFRO1lBQ2QsTUFBTSxDQUFDLEtBQUs7WUFDWixJQUFJLENBQUMsSUFBSTtZQUNULE1BQU0sQ0FBQyxLQUFLO1lBQ1osR0FBRyxTQUFTO1NBQ2YsQ0FBQztRQUVGLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sSUFBSSxDQUFDLEdB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LENBQUM7SUFDM0QsQ0FBQztJQUVPLFdBQVcsQ0FBQyxHQUFHLEdBQVE7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVPLFlBQVksQ0FBQyxHQUFHLEdBQVE7UUFDNUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVPLFlBQVksQ0FBQyxHQUFHLEdBQVE7UUFDNUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVPLGNBQWMsQ0FBQyxHQUFHLEdBQVE7UUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVPLGNBQWMsQ0FBQyxHQUFHLEdBQVE7UUFDOUIsTUFBTSxNQUFNLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQyxNQUFNLElBQUksR0FBVyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsTUFBTSxJQUFJLEdBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUV2QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDdkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDMUQ7UUFFRCxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRTtZQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDN0M7SUFDTCxDQUFDO0lBRU8sT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFXLElBQUksSUFBSSxFQUFFO2FBQzFCLFdBQVcsRUFBRTthQUNiLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQ2pCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFdEIsT0FBTyxJQUFJLElBQUksR0FBRyxDQUFDO0lBQ3ZCLENBQUM7SUFFTyxTQUFTLENBQUMsR0FBUTtRQUN0QixPQUFPLEdBQUc7YUFDTCxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNmLFdBQVcsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFTyxXQUFXLENBQUMsR0FBVztRQUMzQixJQUFJO1lBQ0EsTUFBTSxVQUFVLEdBQVksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRS9DLElBQUksVUFBVSxFQUFFO2dCQUNaLFlBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUU1QztpQkFBTTtnQkFDSCxZQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDM0M7U0FFSjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QjtJQUNMLENBQUM7SUFFTyxXQUFXO1FBQ2YsSUFBSTtZQUNBLFlBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sSUFBSSxDQUFDO1NBRWY7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQztDQUVKO0FBRUQsa0JBQWUsSUFBSSxNQUFNLEVBQUUsQ0FBQyJ9