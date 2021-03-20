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
class logger {
    constructor() {
        this.logFileName = 'logger-mogger.log';
        this.magic_number = 19;
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
        console.log('========================');
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
            NodeLog[call[caller]].apply(this, args);
            this.writeToFile(util_1.default.format.apply(this, args) + '\n');
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
    static info() {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    static warn() {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    static trace() {
        NodeLog.setStack.apply(this, arguments);
    }
    static error() {
        NodeLog.setStack.apply(this, arguments);
    }
    static success() {
        process.stdout.write(util_1.default.format.apply(this, arguments) + '\n');
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
}
exports.default = new logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUNkLGdCQUFnQjtBQUNoQixlQUFlO0FBRWYsSUFBSyxNQVFKO0FBUkQsV0FBSyxNQUFNO0lBQ1AsOEJBQWtCLENBQUE7SUFDbEIsMkJBQWUsQ0FBQTtJQUNmLDRCQUFnQixDQUFBO0lBQ2hCLDhCQUFrQixDQUFBO0lBQ2xCLCtCQUFtQixDQUFBO0lBQ25CLDZCQUFpQixDQUFBO0lBQ2pCLDhCQUFrQixDQUFBO0FBQ3RCLENBQUMsRUFSSSxNQUFNLEtBQU4sTUFBTSxRQVFWO0FBRUQsSUFBSyxNQUtKO0FBTEQsV0FBSyxNQUFNO0lBQ1AsNkJBQWlCLENBQUE7SUFDakIsa0NBQXNCLENBQUE7SUFDdEIsK0JBQW1CLENBQUE7SUFDbkIsNEJBQWtCLENBQUE7QUFDdEIsQ0FBQyxFQUxJLE1BQU0sS0FBTixNQUFNLFFBS1Y7QUFFRCxJQUFLLElBTUo7QUFORCxXQUFLLElBQUk7SUFDTCxvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixvQkFBWSxNQUFNLFVBQUEsQ0FBQTtJQUNsQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQixxQkFBYSxPQUFPLFdBQUEsQ0FBQTtJQUNwQix1QkFBZSxTQUFTLGFBQUEsQ0FBQTtBQUM1QixDQUFDLEVBTkksSUFBSSxLQUFKLElBQUksUUFNUjtBQUVELElBQUssU0FNSjtBQU5ELFdBQUssU0FBUztJQUNWLDhCQUFZLE1BQU0sQ0FBQyxLQUFLLFVBQUEsQ0FBQTtJQUN4Qiw4QkFBWSxNQUFNLENBQUMsTUFBTSxVQUFBLENBQUE7SUFDekIsK0JBQWEsTUFBTSxDQUFDLElBQUksV0FBQSxDQUFBO0lBQ3hCLCtCQUFhLE1BQU0sQ0FBQyxHQUFHLFdBQUEsQ0FBQTtJQUN2QixpQ0FBZSxNQUFNLENBQUMsS0FBSyxhQUFBLENBQUE7QUFDL0IsQ0FBQyxFQU5JLFNBQVMsS0FBVCxTQUFTLFFBTWI7QUFFRCxNQUFNLE1BQU07SUFBWjtRQUVxQixnQkFBVyxHQUFXLG1CQUFtQixDQUFDO1FBQzFDLGlCQUFZLEdBQVcsRUFBRSxDQUFDO0lBMEYvQyxDQUFDO0lBeEZVLElBQUksQ0FBQyxHQUFHLEdBQVU7UUFDckIsTUFBTSxJQUFJLEdBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFFOUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFTSxJQUFJLENBQUMsR0FBRyxHQUFVO1FBQ3JCLE1BQU0sSUFBSSxHQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBRTlDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sS0FBSyxDQUFDLEdBQUcsR0FBVTtRQUN0QixNQUFNLElBQUksR0FBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUUvQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLEtBQUssQ0FBQyxHQUFHLEdBQVU7UUFFdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBR3hDLE1BQU0sSUFBSSxHQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBRS9DLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sT0FBTyxDQUFDLEdBQUcsR0FBVTtRQUN4QixNQUFNLElBQUksR0FBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUVqRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVPLGNBQWM7UUFDbEIsTUFBTSxJQUFJLEdBQVUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQyxNQUFNLElBQUksR0FBVyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEMsTUFBTSxLQUFLLEdBQVcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sTUFBTSxHQUFXLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEdBQUcsS0FBSyxFQUFFLENBQUM7UUFFeEcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVyQixJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUMxRDtRQUVELElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQy9CLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzlDO0lBQ0wsQ0FBQztJQUVPLE9BQU87UUFDWCxNQUFNLElBQUksR0FBVyxJQUFJLElBQUksRUFBRTthQUMxQixXQUFXLEVBQUU7YUFDYixPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQzthQUNqQixTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUVyQyxPQUFPLElBQUksSUFBSSxHQUFHLENBQUM7SUFDdkIsQ0FBQztJQUVPLFdBQVcsQ0FBQyxHQUFXO1FBQzNCLElBQUk7WUFDQSxNQUFNLFVBQVUsR0FBWSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFL0MsSUFBSSxVQUFVLEVBQUU7Z0JBQ1osWUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBRTVDO2lCQUFNO2dCQUNILFlBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUMzQztTQUVKO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hCO0lBQ0wsQ0FBQztJQUVPLFdBQVc7UUFDZixJQUFJO1lBQ0EsWUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUM7U0FFZjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDTCxDQUFDO0NBRUo7QUFFRCxNQUFNLFVBQVU7SUFFTCxNQUFNLENBQUMsSUFBSTtRQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFTSxNQUFNLENBQUMsSUFBSTtRQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFTSxNQUFNLENBQUMsT0FBTztRQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQ0o7QUFFRCxNQUFNLE9BQU87SUFFRixNQUFNLENBQUMsSUFBSTtRQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRU0sTUFBTSxDQUFDLElBQUk7UUFDZCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVNLE1BQU0sQ0FBQyxLQUFLO1FBQ2YsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSztRQUNmLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ00sTUFBTSxDQUFDLE9BQU87UUFDakIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFTyxNQUFNLENBQUMsUUFBUTtRQUNuQixNQUFNLEtBQUssR0FBVSxJQUFJLEtBQUssQ0FBQztRQUMvQixNQUFNLElBQUksR0FBVSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDbkMsTUFBTSxNQUFNLEdBQVcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3BDLE1BQU0sTUFBTSxHQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUUxRSxLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNwQixLQUFLLENBQUMsT0FBTyxHQUFHLGNBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5QyxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekMsQ0FBQztDQUNKO0FBRUQsa0JBQWUsSUFBSSxNQUFNLEVBQUUsQ0FBQyJ9