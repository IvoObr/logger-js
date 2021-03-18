"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
// todo readme
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
    warnNode(...msg) {
        process.stderr.write(util_1.default.format.apply(this, arguments) + '\n');
    }
    traceNode(...msg) {
        var error = new Error;
        error.name = 'Trace';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.traceNode);
        this.warnNode(error.stack);
    }
    errorNode(...msg) {
        var error = new Error;
        error.name = 'Error';
        error.message = util_1.default.format.apply(this, arguments);
        Error.captureStackTrace(error, this.errorNode);
        this.warnNode(error.stack);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsY0FBYztBQUVkLElBQUssTUFRSjtBQVJELFdBQUssTUFBTTtJQUNQLDhCQUFrQixDQUFBO0lBQ2xCLDJCQUFlLENBQUE7SUFDZiw0QkFBZ0IsQ0FBQTtJQUNoQiw4QkFBa0IsQ0FBQTtJQUNsQiwrQkFBbUIsQ0FBQTtJQUNuQiw2QkFBaUIsQ0FBQTtJQUNqQiw4QkFBa0IsQ0FBQTtBQUN0QixDQUFDLEVBUkksTUFBTSxLQUFOLE1BQU0sUUFRVjtBQUVELElBQUssTUFLSjtBQUxELFdBQUssTUFBTTtJQUNQLDZCQUFpQixDQUFBO0lBQ2pCLGtDQUFzQixDQUFBO0lBQ3RCLCtCQUFtQixDQUFBO0lBQ25CLDRCQUFnQixDQUFBO0FBQ3BCLENBQUMsRUFMSSxNQUFNLEtBQU4sTUFBTSxRQUtWO0FBRUQsSUFBSyxJQU1KO0FBTkQsV0FBSyxJQUFJO0lBQ0wscUJBQWEsQ0FBQTtJQUNiLHFCQUFhLENBQUE7SUFDYix1QkFBZSxDQUFBO0lBQ2YsdUJBQWUsQ0FBQTtJQUNmLDJCQUFtQixDQUFBO0FBQ3ZCLENBQUMsRUFOSSxJQUFJLEtBQUosSUFBSSxRQU1SO0FBRUQsTUFBTSxNQUFNO0lBQVo7UUFFWSxnQkFBVyxHQUFXLG1CQUFtQixDQUFDO0lBNkp0RCxDQUFDO0lBM0pVLElBQUksQ0FBQyxHQUFHLEdBQVU7UUFDckIsTUFBTSxJQUFJLEdBQVU7WUFDaEIsTUFBTSxDQUFDLEtBQUs7WUFDWixJQUFJLENBQUMsSUFBSTtZQUNULE1BQU0sQ0FBQyxLQUFLO1lBQ1osR0FBRyxTQUFTO1NBQ2YsQ0FBQztRQUVGLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sSUFBSSxDQUFDLEdBQUcsR0FBVTtRQUNyQixNQUFNLElBQUksR0FBVTtZQUNoQixNQUFNLENBQUMsTUFBTTtZQUNiLElBQUksQ0FBQyxJQUFJO1lBQ1QsTUFBTSxDQUFDLEtBQUs7WUFDWixHQUFHLFNBQVM7U0FDZixDQUFDO1FBRUYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxHQUFVO1FBQ3RCLE1BQU0sSUFBSSxHQUFVO1lBQ2hCLE1BQU0sQ0FBQyxHQUFHO1lBQ1YsSUFBSSxDQUFDLEtBQUs7WUFDVixNQUFNLENBQUMsS0FBSztZQUNaLEdBQUcsU0FBUztTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLEtBQUssQ0FBQyxHQUFHLEdBQVU7UUFDdEIsTUFBTSxJQUFJLEdBQVU7WUFDaEIsTUFBTSxDQUFDLEdBQUc7WUFDVixJQUFJLENBQUMsS0FBSztZQUNWLE1BQU0sQ0FBQyxLQUFLO1lBQ1osR0FBRyxTQUFTO1NBQ2YsQ0FBQztJQUNOLENBQUM7SUFFTSxPQUFPLENBQUMsR0FBRyxHQUFVO1FBQ3hCLE1BQU0sSUFBSSxHQUFVO1lBQ2hCLE1BQU0sQ0FBQyxLQUFLO1lBQ1osSUFBSSxDQUFDLE9BQU87WUFDWixNQUFNLENBQUMsS0FBSztZQUNaLEdBQUcsU0FBUztTQUNmLENBQUM7SUFDTixDQUFDO0lBRU8sUUFBUSxDQUFDLEdBQUcsR0FBVTtRQUMxQixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVPLFFBQVEsQ0FBQyxHQUFHLEdBQVU7UUFDMUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFTyxTQUFTLENBQUMsR0FBRyxHQUFVO1FBQzNCLElBQUksS0FBSyxHQUFVLElBQUksS0FBSyxDQUFDO1FBQzdCLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1FBQ3JCLEtBQUssQ0FBQyxPQUFPLEdBQUcsY0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ25ELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFTyxTQUFTLENBQUMsR0FBRyxHQUFVO1FBQzNCLElBQUksS0FBSyxHQUFVLElBQUksS0FBSyxDQUFDO1FBQzdCLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1FBQ3JCLEtBQUssQ0FBQyxPQUFPLEdBQUcsY0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ25ELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFTyxXQUFXLENBQUMsR0FBRyxHQUFVO1FBQzdCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRU8sV0FBVyxDQUFDLEdBQUcsR0FBVTtRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRU8sV0FBVyxDQUFDLEdBQUcsR0FBVTtRQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRU8sWUFBWSxDQUFDLEdBQUcsR0FBVTtRQUM5QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRU8sWUFBWSxDQUFDLEdBQUcsR0FBVTtRQUM5QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRU8sY0FBYyxDQUFDLEdBQUcsR0FBVTtRQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRU8sY0FBYyxDQUFDLEdBQUcsR0FBVTtRQUNoQyxNQUFNLE1BQU0sR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwQyxNQUFNLElBQUksR0FBVSxDQUFDLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBRXpDLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFO1lBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN2QyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUMxRDtRQUVELElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO1lBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUM3QztJQUNMLENBQUM7SUFFTyxPQUFPO1FBQ1gsTUFBTSxJQUFJLEdBQVcsSUFBSSxJQUFJLEVBQUU7YUFDMUIsV0FBVyxFQUFFO2FBQ2IsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7YUFDakIsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV0QixPQUFPLElBQUksSUFBSSxHQUFHLENBQUM7SUFDdkIsQ0FBQztJQUVPLFNBQVMsQ0FBQyxHQUFVO1FBQ3hCLE9BQU8sR0FBRzthQUNMLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2YsV0FBVyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVPLFdBQVcsQ0FBQyxHQUFXO1FBQzNCLElBQUk7WUFDQSxNQUFNLFVBQVUsR0FBWSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFL0MsSUFBSSxVQUFVLEVBQUU7Z0JBQ1osWUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBRTVDO2lCQUFNO2dCQUNILFlBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUMzQztTQUVKO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hCO0lBQ0wsQ0FBQztJQUVPLFdBQVc7UUFDZixJQUFJO1lBQ0EsWUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUM7U0FFZjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDTCxDQUFDO0NBRUo7QUFFRCxrQkFBZSxJQUFJLE1BQU0sRUFBRSxDQUFDIn0=