"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telnet = void 0;
var TelnetEvent_1 = require("./TelnetEvent");
var events_1 = require("events");
var consts_1 = require("./consts");
var telnet = require("../build/libtelnet");
telnet.onRuntimeInitialized = function () {
    telnet._init();
    Telnet.runtimeInitialized();
};
/**
 * A state machine that implements the telnet specification and calls out into
 * web assembly to encode and decode messages from a socket.
 */
var Telnet = /** @class */ (function (_super) {
    __extends(Telnet, _super);
    function Telnet(compatibilityTable, flags) {
        var _this = _super.call(this) || this;
        /** A collection of pointers to be freed when this Telnet object is disposed. */
        _this._toFree = [];
        // TODO: make the CompatibilityTable interface more user friendly.
        // collect a reference to the heap and how long the table needs to be
        var heap = new DataView(telnet.HEAPU8.buffer);
        var length = compatibilityTable.length;
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
        // add the array to the auto-free pointers when this telnet is destroyed
        _this._toFree.push(arrayPointer);
        // for each entry in the compatibility table
        for (var i = 0; i < length; i++) {
            var entry = compatibilityTable[i];
            // allocate 4 bytes, [i16, u8, u8]
            var entryPointer = telnet._malloc(4);
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
            // each entry should be freed at some point
            _this._toFree.push(entryPointer);
            // set the table entry at the next index
            heap.setUint32(arrayPointer + (i << 2), entryPointer, true);
        }
        // create the last entry [-1, 0, 0]
        var finalEntryPointer = telnet._malloc(4);
        if (finalEntryPointer === 0)
            throw new Error("Out of memory.");
        heap.setUint32(finalEntryPointer, 0, true); // clear the memory in case
        heap.setInt16(finalEntryPointer + consts_1.consts.telnet_telopt_t_telopt_offset, -1);
        _this._toFree.push(finalEntryPointer);
        // set the last entry in the table
        heap.setUint32(arrayPointer + (length << 2), finalEntryPointer, true);
        // finally pass the array pointer into the telnet_init function
        _this.pointer = telnet._telnet_init(arrayPointer, flags, 0); // user data is null
        // hook up event listener
        Telnet.map.set(_this.pointer, _this);
        return _this;
    }
    /** A routing function that gets called from web assembly when a Telnet object must fire an event. */
    Telnet.route = function (telnet, eventPointer, _userDataPointer) {
        var target = Telnet.map.get(telnet);
        if (!target)
            throw new Error("Invalid event target.");
        var event = Telnet.getEvent(eventPointer);
        switch (event.type) {
            case consts_1.TelnetEventType.DO:
            case consts_1.TelnetEventType.DONT:
            case consts_1.TelnetEventType.WILL:
            case consts_1.TelnetEventType.WONT: {
                return target.emit("negotiate", event.negotiate);
            }
            case consts_1.TelnetEventType.IAC: {
                return target.emit("iac", event.iac);
            }
            case consts_1.TelnetEventType.DATA:
            case consts_1.TelnetEventType.SEND: {
                return target.emit("data", event.data);
            }
            case consts_1.TelnetEventType.WARNING:
            case consts_1.TelnetEventType.ERROR: {
                return target.emit("error", event.error);
            }
            case consts_1.TelnetEventType.SUBNEGOTIATION: {
                return target.emit("sb", event.sub);
            }
            case consts_1.TelnetEventType.ZMP: {
                return target.emit("zmp", event.zmp);
            }
            case consts_1.TelnetEventType.TTYPE: {
                return target.emit("ttype", event.ttype);
            }
            case consts_1.TelnetEventType.COMPRESS: {
                return target.emit("compress", event.compress);
            }
            case consts_1.TelnetEventType.ENVIRON: {
                return target.emit("environ", event.environ);
            }
            case consts_1.TelnetEventType.MSSP: {
                return target.emit("mssp", event.mssp);
            }
            default:
                return false;
        }
    };
    Telnet.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, __spread([event], args));
    };
    Telnet.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    /** Create a TelnetEvent from a given pointer. */
    Telnet.getEvent = function (pointer) {
        return new TelnetEvent_1.TelnetEvent(pointer, new DataView(telnet.HEAPU8.buffer));
    };
    /**
     * Whenever a socket receives a message, call this method with the array of bytes
     * that were received.
     *
     * @param {ArrayLike<number>} bytes - An arraylike reference that contains byte values.
     */
    Telnet.prototype.receive = function (bytes) {
        var bufferLength = bytes.length;
        var bufferPointer = telnet._malloc(bufferLength + 1);
        if (bufferPointer === 0)
            throw new Error("Out of memory.");
        telnet.HEAPU8.set(bytes, bufferPointer);
        telnet.HEAPU8[bufferPointer + bufferLength] = 0;
        telnet._telnet_recv(this.pointer, bufferPointer, bufferLength);
        telnet._free(bufferPointer);
    };
    /**
     * Whenever an IAC event must be emitted, this method will automatically generate a SEND event.
     *
     * Format: [IAC, CMD]
     * @param {TelnetCommand} cmd - The TelnetCommand to be sent.
     */
    Telnet.prototype.iac = function (cmd) {
        telnet._telnet_iac(this.pointer, cmd);
    };
    /**
     * Send a WILL, WONT, DO or DONT negotiation for a given option. This automatically generates a SEND event.
     *
     * @param {TelnetNegotiationCommand} cmd - DO, DONT, WILL, or WONT
     * @param {TelnetOption} option - The telnet option.
     */
    Telnet.prototype.negotiate = function (cmd, option) {
        telnet._telnet_negotiate(this.pointer, cmd, option);
    };
    /**
     * Send raw bytes through telnet so that the bytes are encoded properly.
     *
     * @param {ArrayLike<number>} buffer - The data to be sent.
     */
    Telnet.prototype.send = function (buffer) {
        var length = buffer.length;
        var ptr = telnet._malloc(length);
        telnet.HEAPU8.set(buffer, ptr);
        telnet._telnet_send(this.pointer, ptr, length);
    };
    /**
     * Send a string encoded to ASCII through telnet.
     *
     * @param {string} str - The string to be sent.
     */
    Telnet.prototype.sendText = function (str) {
        var length = str.length + 1; // add 1 for null termination
        var ptr = telnet._malloc(length);
        telnet.writeAsciiToMemory(ptr, str, false);
        telnet._telnet_send_text(this.pointer, ptr, length - 1);
        telnet._free(ptr);
    };
    /**
     * Send a subnegotiation event through telnet.
     *
     * @param {TelnetOption} telopt - The telnet option for subnegotiation.
     * @param {ArrayLike<number>} data - The data to be encoded.
     */
    Telnet.prototype.subnegotiation = function (telopt, data) {
        var length = data.length;
        var pointer = telnet._malloc(length);
        telnet.HEAPU8.set(data, pointer);
        telnet._telnet_subnegotiation(this.pointer, telopt, pointer, length);
        telnet._free(pointer);
    };
    /** Call this method when the connection is disposed or you will have memory leaks. */
    Telnet.prototype.dispose = function () {
        this._toFree.forEach(function (ptr) { return telnet._free(ptr); });
        telnet._telnet_free(this.pointer);
        Telnet.map.delete(this.pointer);
    };
    Telnet.runtimeInitialized = function () { return void 0; };
    /** A map of pointers to their respective Telnet objects for event routing. */
    Telnet.map = new Map();
    return Telnet;
}(events_1.EventEmitter));
exports.Telnet = Telnet;
//# sourceMappingURL=Telnet.js.map