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
        this.logFileName = 'logger-mogger.log';
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
            this.writeToFile(`${time} ${level.prefix} ${msg += '\r\n'}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLG9EQUE0QjtBQUM1Qiw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBY3hCLE1BQU0sTUFBTTtJQUtSLFlBQVksT0FBcUI7UUFIekIsZ0JBQVcsR0FBVyxtQkFBbUIsQ0FBQztRQUMxQyxnQkFBVyxHQUFZLElBQUksQ0FBQztRQUloQyxJQUFJLE9BQU8sQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsV0FBVyxDQUFBLEtBQUssUUFBUSxFQUFFO1lBQzFDLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLFdBQVcsQ0FBQztTQUMzQztRQUVELElBQUksT0FBTyxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxXQUFXLENBQUEsS0FBSyxTQUFTLEVBQUU7WUFDM0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsV0FBVyxDQUFDO1NBQzNDO0lBQ0wsQ0FBQztJQUVNLE9BQU8sQ0FBQyxHQUFXO1FBQ3RCLEdBQUcsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2YsS0FBSyxFQUFFLEtBQUs7WUFDWixNQUFNLEVBQUUsV0FBVztTQUN0QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0sSUFBSSxDQUFDLEdBQVc7UUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDZixLQUFLLEVBQUUsT0FBTztZQUNkLE1BQU0sRUFBRSxXQUFXO1NBQ3RCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTSxPQUFPLENBQUMsR0FBVztRQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNmLEtBQUssRUFBRSxPQUFPO1lBQ2QsTUFBTSxFQUFFLFdBQVc7U0FDdEIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLElBQUksQ0FBQyxHQUFXO1FBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2YsS0FBSyxFQUFFLFFBQVE7WUFDZixNQUFNLEVBQUUsV0FBVztTQUN0QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0sS0FBSyxDQUFDLEdBQW1CO1FBQzVCLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNmLEtBQUssRUFBRSxLQUFLO1lBQ1osTUFBTSxFQUFFLFdBQVc7U0FDdEIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLFFBQVEsQ0FBQyxHQUFtQixFQUFFLEtBQWdCO1FBRWxELE1BQU0sSUFBSSxHQUFXLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDN0YsTUFBTSxPQUFPLEdBQWlCLGdCQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUUvRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ2hFO0lBQ0wsQ0FBQztJQUVPLFdBQVcsQ0FBQyxHQUFXO1FBQzNCLElBQUk7WUFDQSxNQUFNLFVBQVUsR0FBWSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFL0MsSUFBSSxVQUFVLEVBQUU7Z0JBQ1osWUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBRTVDO2lCQUFNO2dCQUNILFlBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUMzQztTQUVKO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hCO0lBQ0wsQ0FBQztJQUVPLFdBQVc7UUFDZixJQUFJO1lBQ0EsWUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUM7U0FFZjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDTCxDQUFDO0NBRUo7QUFFRCxrQkFBZSxJQUFJLE1BQU0sRUFBRSxDQUFDIn0=