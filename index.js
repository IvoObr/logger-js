"use strict";
exports.__esModule = true;
var colors_1 = require("colors");
var fs_1 = require("fs");
var util_1 = require("util");
var logger = /** @class */ (function () {
    function logger(options) {
        this.logFileName = 'logger.log';
        this.writeInFile = true;
        if (typeof (options === null || options === void 0 ? void 0 : options.logFileName) === 'string') {
            this.logFileName = options === null || options === void 0 ? void 0 : options.logFileName;
        }
        if (typeof (options === null || options === void 0 ? void 0 : options.writeInFile) === 'boolean') {
            this.writeInFile = options === null || options === void 0 ? void 0 : options.writeInFile;
        }
    }
    logger.prototype.inspect = function (msg) {
        msg = util_1["default"].inspect(msg);
        this.printLog(msg, {
            color: 'dim',
            prefix: 'INSPECT: '
        });
    };
    logger.prototype.info = function (msg) {
        this.printLog(msg, {
            color: 'white',
            prefix: 'INFO:    '
        });
    };
    logger.prototype.success = function (msg) {
        this.printLog(msg, {
            color: 'green',
            prefix: 'SUCCESS: '
        });
    };
    logger.prototype.warn = function (msg) {
        this.printLog(msg, {
            color: 'yellow',
            prefix: 'WARNING: '
        });
    };
    logger.prototype.error = function (msg) {
        // msg = util.inspect(msg);
        this.printLog(msg, {
            color: 'red',
            prefix: 'ERROR:   '
        });
    };
    logger.prototype.printLog = function (msg, level) {
        var time = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ']';
        var colorFn = colors_1["default"][level.color];
        console.log(time + " " + colorFn(level.prefix).bold + " " + colorFn(msg));
        if (this.writeInFile) {
            this.writeToFile(time + " " + level.prefix + ": " + (msg += '\r\n'));
        }
    };
    logger.prototype.writeToFile = function (msg) {
        try {
            var fileExists = this.doFileExist();
            if (fileExists) {
                fs_1["default"].appendFileSync(this.logFileName, msg);
            }
            else {
                fs_1["default"].writeFileSync(this.logFileName, msg);
            }
        }
        catch (error) {
            console.error(error);
        }
    };
    logger.prototype.doFileExist = function () {
        try {
            fs_1["default"].accessSync(this.logFileName);
            return true;
        }
        catch (error) {
            return false;
        }
    };
    return logger;
}());
exports["default"] = new logger();
