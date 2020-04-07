"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompatibilityTable = void 0;
var consts_1 = require("./consts");
var telnet = require("../build/libtelnet");
/** This class represents a table of supported telnet options. */
var CompatibilityTable = /** @class */ (function () {
    function CompatibilityTable() {
        this.pointer = 0;
        this.table = [];
    }
    /** Shorthand for new CompatibilityTableGenerator() */
    CompatibilityTable.create = function () {
        return new CompatibilityTable();
    };
    /** Add a supported option, and wether it's supported locally and/or remotely. */
    CompatibilityTable.prototype.support = function (option, local, remote) {
        this.table.push([
            option,
            local ? consts_1.TelnetCommand.WILL : consts_1.TelnetCommand.WONT,
            remote ? consts_1.TelnetCommand.DO : consts_1.TelnetCommand.DONT,
        ]);
        return this;
    };
    /** Finally generate the table. This will commit the table to memory and can be reused. */
    CompatibilityTable.prototype.finish = function () {
        if (this.pointer !== 0)
            return this;
        // collect a reference to the heap and how long the table needs to be
        var heap = new DataView(telnet.HEAPU8.buffer);
        var table = this.table;
        var length = table.length;
        // Create a set of telnet_telopt_t references ending with an additional [-1, 0, 0]
        // telnet_telopt_t shape (4 bytes)
        // short telopt
        // unsigned char us
        // unsigned char him
        // the array size must contain (length + 1) * u32_size bytes
        var arraySize = (length + 1) << 2;
        // allocate the array
        var arrayPointer = telnet._malloc(arraySize);
        if (arrayPointer === 0)
            throw new Error("Out of memory.");
        // for each entry in the compatibility table
        for (var i = 0; i < length; i++) {
            var entry = table[i];
            // allocate 4 bytes, [i16, u8, u8]
            var entryPointer = arrayPointer + (i << consts_1.consts.U32_ALIGN);
            if (entryPointer === 0)
                throw new Error("Out of memory.");
            // set the telopt option value
            heap.setInt16(entryPointer + consts_1.consts.telnet_telopt_t_telopt_offset, entry[0], true);
            // should be set to WILL/WONT
            var us = entry[1] ? consts_1.TelnetCommand.WILL : consts_1.TelnetCommand.WONT;
            heap.setUint8(entryPointer + consts_1.consts.telnet_telopt_t_us_offset, us);
            // should be set to DO/DONT
            var him = entry[2] ? consts_1.TelnetCommand.DO : consts_1.TelnetCommand.DONT;
            heap.setUint8(entryPointer + consts_1.consts.telnet_telopt_t_him_offset, him);
        }
        // create the last entry [-1, 0, 0]
        var finalEntryPointer = telnet._malloc(4);
        if (finalEntryPointer === 0)
            throw new Error("Out of memory.");
        heap.setUint32(finalEntryPointer, 0, true); // clear the memory in case
        heap.setInt16(finalEntryPointer + consts_1.consts.telnet_telopt_t_telopt_offset, -1);
        // set the last entry in the table
        heap.setUint32(arrayPointer + (length << 2), finalEntryPointer, true);
        this.pointer = arrayPointer;
        return this;
    };
    /** Dispose this table when it is no longer needed or used. */
    CompatibilityTable.prototype.dispose = function () {
        telnet._free(this.pointer);
    };
    return CompatibilityTable;
}());
exports.CompatibilityTable = CompatibilityTable;
//# sourceMappingURL=CompatibilityTable.js.map