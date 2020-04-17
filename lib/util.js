"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataView = exports.getHeapU8 = exports.writeAsciiToMemory = exports.AsciiToString = void 0;
function AsciiToString(telnet, ptr) {
    if (ptr === 0)
        return null;
    var decoder = new TextDecoder();
    var heap = getHeapU8(telnet);
    var end = heap.indexOf(0, ptr);
    return decoder.decode(heap.subarray(ptr, end));
}
exports.AsciiToString = AsciiToString;
function writeAsciiToMemory(telnet, str) {
    var encoder = new TextEncoder();
    var binary = encoder.encode(str);
    var pointer = telnet.malloc(binary.byteLength + 1);
    // in case the memory increases
    var heap = getHeapU8(telnet);
    heap.set(binary, pointer);
    heap[pointer + binary.byteLength] = 0; // null terminated
    return pointer;
}
exports.writeAsciiToMemory = writeAsciiToMemory;
function getHeapU8(telnet) {
    return new Uint8Array(telnet.memory.buffer);
}
exports.getHeapU8 = getHeapU8;
function getDataView(telnet) {
    return new DataView(telnet.memory.buffer);
}
exports.getDataView = getDataView;
//# sourceMappingURL=util.js.map