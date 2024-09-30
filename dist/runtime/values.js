"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MK_NATIVE_FUNCTION = exports.MK_BOOL = exports.MK_NUMBER = exports.MK_NULL = void 0;
function MK_NULL() {
    return { type: "null", value: null };
}
exports.MK_NULL = MK_NULL;
function MK_NUMBER(n = 0) {
    return { type: "number", value: n };
}
exports.MK_NUMBER = MK_NUMBER;
function MK_BOOL(b = false) {
    return { type: "boolean", value: b };
}
exports.MK_BOOL = MK_BOOL;
function MK_NATIVE_FUNCTION(call) {
    return { type: "native-function", call };
}
exports.MK_NATIVE_FUNCTION = MK_NATIVE_FUNCTION;
