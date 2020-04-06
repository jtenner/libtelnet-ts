"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelnetEvent = exports.TTypeCommand = exports.EnvironVarType = void 0;
var consts_1 = require("./consts");
/** The imported emscripten api that calls the c lib functions. */
var telnet = require("../build/libtelnet");
var U32_ALIGN = 2;
/** Collect a set of environ vars from a telnet_environ_t*. */
function getEnvironVars(pointer, size, heap) {
    var result = [];
    for (var i = 0; i < size; i++, pointer += 12) {
        var valueStringPointer = heap.getUint32(pointer + consts_1.consts.telnet_environ_t_value_offset, true);
        var varStringPointer = heap.getUint32(pointer + consts_1.consts.telnet_environ_t_var_offset, true);
        result.push({
            type: heap.getUint8(pointer + consts_1.consts.telnet_environ_t_type_offset),
            value: telnet.AsciiToString(valueStringPointer),
            var: telnet.AsciiToString(varStringPointer),
        });
    }
    return result;
}
/** The environ var types. */
var EnvironVarType;
(function (EnvironVarType) {
    EnvironVarType[EnvironVarType["VAR"] = 0] = "VAR";
    EnvironVarType[EnvironVarType["VALUE"] = 1] = "VALUE";
    EnvironVarType[EnvironVarType["ESC"] = 2] = "ESC";
    EnvironVarType[EnvironVarType["USERVAR"] = 3] = "USERVAR";
})(EnvironVarType = exports.EnvironVarType || (exports.EnvironVarType = {}));
/** TType Command. */
var TTypeCommand;
(function (TTypeCommand) {
    TTypeCommand[TTypeCommand["IS"] = 0] = "IS";
    TTypeCommand[TTypeCommand["SEND"] = 1] = "SEND";
})(TTypeCommand = exports.TTypeCommand || (exports.TTypeCommand = {}));
/**
 * A basis for all telnet events. Internal use only. It uses the internal
 * properties to "Cast" the event to the appropriate type.
 */
var TelnetEvent = /** @class */ (function () {
    function TelnetEvent(pointer, heap) {
        this.pointer = pointer;
        this.heap = heap;
        this.type = heap.getUint32(pointer, true);
    }
    Object.defineProperty(TelnetEvent.prototype, "data", {
        /**
         * Interpret this event as a data event. Either TelnetEventType.{Data | Send}.
         *
         * struct data_t {
         *   enum telnet_event_type_t _type; -> EventType
         *   const char *buffer; -> string
         *   size_t size; -> number
         * } data;
         */
        get: function () {
            var pointer = this.pointer;
            var bufferPointer = this.heap.getUint32(pointer + consts_1.consts.data_t_buffer_offset, true);
            var bufferLength = this.heap.getUint32(pointer + consts_1.consts.data_t_size_offset, true);
            return {
                type: this.type,
                buffer: new Uint8Array(this.heap.buffer.slice(bufferPointer, bufferPointer + bufferLength)),
                size: bufferLength,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "error", {
        /**
         * Interpret this event as an error.
         *
         * struct error_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   const char *file; -> string
         *   const char *func; -> string
         *   const char *msg; -> string
         *   int line; -> number
         *   telnet_error_t errcode; -> TelnetErrorCode
         * } error;
         */
        get: function () {
            var heap = this.heap;
            var filePointer = heap.getUint32(this.pointer + consts_1.consts.error_t_file_offset, true);
            var funcPointer = heap.getUint32(this.pointer + consts_1.consts.error_t_func_offset, true);
            var messagePointer = heap.getUint32(this.pointer + consts_1.consts.error_t_msg_offset, true);
            var line = heap.getUint32(this.pointer + consts_1.consts.error_t_line_offset, true);
            var errcode = heap.getUint32(this.pointer + consts_1.consts.error_t_errcode_offset, true);
            return {
                errcode: errcode,
                file: telnet.AsciiToString(filePointer),
                func: telnet.AsciiToString(funcPointer),
                line: line,
                msg: telnet.AsciiToString(messagePointer),
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "iac", {
        /**
         * Interpret this event as an IAC (Interpret as Command)
         *
         * struct iac_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   unsigned char cmd; -> TelnetOption
         * } iac;
         */
        get: function () {
            return {
                type: this.type,
                cmd: this.heap.getUint8(this.pointer + consts_1.consts.iac_t_cmd_offset),
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "negotiate", {
        /**
         * Interpret this event as a Negotiation event. I.E. DO, DONT, WILL, WONT
         *
         * struct negotiate_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   unsigned char telopt; -> TelnetOption
         * } neg;
         */
        get: function () {
            return {
                type: this.type,
                telopt: this.heap.getUint8(this.pointer + consts_1.consts.negotiate_t_telopt_offset),
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "sub", {
        /**
         * Interpret this event as a subnegotiation.
         *
         * struct subnegotiation_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   const char *buffer; -> Uint8Array
         *   size_t size; -> number
         *   unsigned char telopt; -> TelnetOption
         * } sub;
         */
        get: function () {
            var heap = this.heap;
            var pointer = this.pointer;
            var bufferPointer = heap.getUint32(pointer + consts_1.consts.subnegotiate_t_buffer_offset, true);
            var size = heap.getUint32(pointer + consts_1.consts.subnegotiate_t_size_offset, true);
            var telopt = heap.getUint8(pointer + consts_1.consts.subnegotiate_t_telopt_offset);
            return {
                buffer: new Uint8Array(this.heap.buffer, bufferPointer, size),
                size: size,
                telopt: telopt,
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "zmp", {
        /**
         * Interpret this event as a ZMP event.
         *
         * struct zmp_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   const char **argv; -> string[]
         *   size_t argc; -> number
         * } zmp;
         */
        get: function () {
            var heap = this.heap;
            var pointer = this.pointer;
            var argc = heap.getUint32(pointer + consts_1.consts.zmp_t_argc_offset, true);
            // pointer + argv_offset is the memory location for the array of pointers
            var argvPointer = heap.getUint32(pointer + consts_1.consts.zmp_t_argv_offset, true);
            var argv = [];
            for (var i = 0; i < argc; i++) {
                // dereference the pointer at argvPointer + (i << alignof<u32>())
                var stringPointer = heap.getUint32(argvPointer + (i << U32_ALIGN), true);
                var value = telnet.AsciiToString(stringPointer);
                argv.push(value);
            }
            return {
                argc: argc,
                argv: argv,
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "ttype", {
        /**
         * Interpret this event as a TType event.
         *
         * struct ttype_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   unsigned char cmd; -> TTypeCommand
         *   const char* name; -> string
         * } ttype;
         */
        get: function () {
            var heap = this.heap;
            var pointer = this.pointer;
            var cmd = heap.getUint8(pointer + consts_1.consts.ttype_t_cmd_offset);
            var namePointer = heap.getUint32(pointer + consts_1.consts.ttype_t_name_offset, true);
            return {
                cmd: cmd,
                name: telnet.AsciiToString(namePointer),
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "compress", {
        /**
         * Interpet this event as a Compress event.
         *
         * struct compress_T {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   unsigned char state; -> boolean
         * } compress;
         */
        get: function () {
            return {
                type: this.type,
                state: this.heap.getUint8(this.pointer + consts_1.consts.compress_t_state_offset) === 1,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "environ", {
        /**
         * Interpret this event as an Environ event.
         *
         * struct environ_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   const struct telnet_environ_t *values; -> IEnvironVar[]
         *   size_t size; -> number
         *   unsigned char cmd; -> EnvironCommand
         * } environ;
         */
        get: function () {
            var pointer = this.pointer;
            var heap = this.heap;
            var cmd = heap.getUint8(pointer + consts_1.consts.environ_t_cmd_offset);
            var size = heap.getUint32(pointer + consts_1.consts.environ_t_size_offset, true);
            var valuesPointer = heap.getUint32(pointer + consts_1.consts.environ_t_values_offset, true);
            var values = getEnvironVars(valuesPointer, size, heap);
            return {
                cmd: cmd,
                size: size,
                values: values,
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TelnetEvent.prototype, "mssp", {
        /**
         * Interpret this event as a MSSP event.
         *
         * struct mssp_t {
         *   enum telnet_event_type_t _type; -> TelnetEventType
         *   const struct telnet_environ_t *values; -> IEnvironVar[]
         *   size_t size; -> number
         * } mssp;
         */
        get: function () {
            var pointer = this.pointer;
            var heap = this.heap;
            var size = heap.getUint32(pointer + consts_1.consts.mssp_t_size_offset, true);
            var valuesPointer = heap.getUint32(pointer + consts_1.consts.mssp_t_values_offset, true);
            var values = getEnvironVars(valuesPointer, size, heap);
            return {
                size: size,
                values: values,
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    return TelnetEvent;
}());
exports.TelnetEvent = TelnetEvent;
//# sourceMappingURL=TelnetEvent.js.map