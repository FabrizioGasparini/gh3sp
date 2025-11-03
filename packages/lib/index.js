"use strict";
var process = require("node:process");
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathError = void 0;
exports.MK_NUMBER = MK_NUMBER;
exports.MK_STRING = MK_STRING;
exports.handleError = handleError;
function MK_NUMBER(value) {
    return { type: "number", value: value };
}
function MK_STRING(value) {
    return { type: "string", value: value };
}
var MathError = /** @class */ (function (_super) {
    __extends(MathError, _super);
    function MathError(error) {
        var _this = _super.call(this, error) || this;
        _this.name = "MathError";
        return _this;
    }
    return MathError;
}(Error));
exports.MathError = MathError;
var Print = /** @class */ (function () {
    function Print() {
    }
    Print.RED = "\x1b[31m";
    Print.GREEN = "\x1b[32m";
    Print.BLUE = "\x1b[34m";
    Print.YELLOW = "\x1b[33m";
    Print.MAGENTA = "\x1b[35m";
    Print.CYAN = "\x1b[36m";
    Print.WHITE = "\x1b[37m";
    Print.BOLD = "\x1b[1m";
    Print.UNDERLINE = "\x1b[4m";
    Print.DEFAULT = "\x1b[0m";
    return Print;
}());
function handleError(error, line, column) {
    console.error(Print.RED + "".concat(error.name, ": ").concat(Print.DEFAULT).concat(error.message, " at ").concat(process.argv[2], ":").concat(line, ":").concat(column));
    var stackLines = error.stack.split("\n");
    for (var i = 0; i < stackLines.length; i++) {
        if (i > 0) {
            console.error(stackLines[i]);
        }
    }
    process.exit(1)
}
