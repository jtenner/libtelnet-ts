"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompatibilityTable = void 0;
var telnet = require("../build/libtelnet");
/** This class represents a table of supported telnet options. */
var CompatibilityTable = /** @class */ (function () {
    function CompatibilityTable() {
        this.pointer = 0;
        this.table = new Uint8Array(256);
    }
    /** Shorthand for new CompatibilityTableGenerator() */
    CompatibilityTable.create = function () {
        return new CompatibilityTable();
    };
    /** Add a supported option, and wether it's supported locally and/or remotely. */
    CompatibilityTable.prototype.support = function (option, local, remote) {
        this.table[option] = (local ? 2 : 0) | (remote ? 1 : 0);
        return this;
    };
    /** Finally generate the table. This will commit the table to memory and can be reused. */
    CompatibilityTable.prototype.finish = function () {
        if (this.pointer !== 0)
            return this;
        // allocate the array
        var arrayPointer = telnet._malloc(256);
        if (arrayPointer === 0)
            throw new Error("Out of memory.");
        // set the memory at the pointer
        telnet.HEAPU8.set(this.table, arrayPointer);
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