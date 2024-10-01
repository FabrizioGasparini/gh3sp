"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MK_NULL = MK_NULL;
exports.MK_NUMBER = MK_NUMBER;
exports.MK_STRING = MK_STRING;
exports.MK_BOOL = MK_BOOL;
exports.MK_NATIVE_FUNCTION = MK_NATIVE_FUNCTION;
function MK_NULL() {
    return { type: "null", value: null };
}
function MK_NUMBER(n = 0) {
    return { type: "number", value: n };
}
function MK_STRING(s = "") {
    return { type: "string", value: s };
}
function MK_BOOL(b = false) {
    return { type: "boolean", value: b };
}
function MK_NATIVE_FUNCTION(call) {
    return { type: "native-function", call };
}
