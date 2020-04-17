"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelnetErrorCode = exports.EnvironCommand = exports.TelnetOption = exports.TelnetEventType = exports.TelnetFlag = exports.TelnetCommand = exports.consts = void 0;
// This set of constants are controlled by the init() function in libtelnet.c
var consts;
(function (consts) {
    consts.data_t_buffer_offset = 0;
    consts.data_t_size_offset = 0;
    consts.error_t_file_offset = 0;
    consts.error_t_func_offset = 0;
    consts.error_t_msg_offset = 0;
    consts.error_t_line_offset = 0;
    consts.error_t_errcode_offset = 0;
    consts.iac_t_cmd_offset = 0;
    consts.negotiate_t_telopt_offset = 0;
    consts.subnegotiate_t_buffer_offset = 0;
    consts.subnegotiate_t_size_offset = 0;
    consts.subnegotiate_t_telopt_offset = 0;
    consts.zmp_t_argc_offset = 0;
    consts.zmp_t_argv_offset = 0;
    consts.ttype_t_cmd_offset = 0;
    consts.ttype_t_name_offset = 0;
    consts.compress_t_state_offset = 0;
    consts.environ_t_values_offset = 0;
    consts.environ_t_size_offset = 0;
    consts.environ_t_cmd_offset = 0;
    consts.telnet_environ_t_type_offset = 0;
    consts.telnet_environ_t_var_offset = 0;
    consts.telnet_environ_t_value_offset = 0;
    consts.mssp_t_values_offset = 0;
    consts.mssp_t_size_offset = 0;
    consts.telnet_telopt_t_telopt_offset = 0;
    consts.telnet_telopt_t_us_offset = 0;
    consts.telnet_telopt_t_him_offset = 0;
    consts.U32_ALIGN = 2;
})(consts = exports.consts || (exports.consts = {}));
var TelnetCommand;
(function (TelnetCommand) {
    TelnetCommand[TelnetCommand["IAC"] = 255] = "IAC";
    TelnetCommand[TelnetCommand["DONT"] = 254] = "DONT";
    TelnetCommand[TelnetCommand["DO"] = 253] = "DO";
    TelnetCommand[TelnetCommand["WONT"] = 252] = "WONT";
    TelnetCommand[TelnetCommand["WILL"] = 251] = "WILL";
    TelnetCommand[TelnetCommand["SB"] = 250] = "SB";
    TelnetCommand[TelnetCommand["GA"] = 249] = "GA";
    TelnetCommand[TelnetCommand["EL"] = 248] = "EL";
    TelnetCommand[TelnetCommand["EC"] = 247] = "EC";
    TelnetCommand[TelnetCommand["AYT"] = 246] = "AYT";
    TelnetCommand[TelnetCommand["AO"] = 245] = "AO";
    TelnetCommand[TelnetCommand["IP"] = 244] = "IP";
    TelnetCommand[TelnetCommand["BREAK"] = 243] = "BREAK";
    TelnetCommand[TelnetCommand["DM"] = 242] = "DM";
    TelnetCommand[TelnetCommand["NOP"] = 241] = "NOP";
    TelnetCommand[TelnetCommand["SE"] = 240] = "SE";
    TelnetCommand[TelnetCommand["EOR"] = 239] = "EOR";
    TelnetCommand[TelnetCommand["ABORT"] = 238] = "ABORT";
    TelnetCommand[TelnetCommand["SUSP"] = 237] = "SUSP";
    TelnetCommand[TelnetCommand["EOF"] = 236] = "EOF";
})(TelnetCommand = exports.TelnetCommand || (exports.TelnetCommand = {}));
var TelnetFlag;
(function (TelnetFlag) {
    TelnetFlag[TelnetFlag["NONE"] = 0] = "NONE";
    TelnetFlag[TelnetFlag["PROXY"] = 1] = "PROXY";
    TelnetFlag[TelnetFlag["NVT_EOL"] = 2] = "NVT_EOL";
})(TelnetFlag = exports.TelnetFlag || (exports.TelnetFlag = {}));
var TelnetEventType;
(function (TelnetEventType) {
    TelnetEventType[TelnetEventType["DATA"] = 0] = "DATA";
    TelnetEventType[TelnetEventType["SEND"] = 1] = "SEND";
    TelnetEventType[TelnetEventType["IAC"] = 2] = "IAC";
    TelnetEventType[TelnetEventType["WILL"] = 3] = "WILL";
    TelnetEventType[TelnetEventType["WONT"] = 4] = "WONT";
    TelnetEventType[TelnetEventType["DO"] = 5] = "DO";
    TelnetEventType[TelnetEventType["DONT"] = 6] = "DONT";
    TelnetEventType[TelnetEventType["SUBNEGOTIATION"] = 7] = "SUBNEGOTIATION";
    TelnetEventType[TelnetEventType["COMPRESS"] = 8] = "COMPRESS";
    TelnetEventType[TelnetEventType["ZMP"] = 9] = "ZMP";
    TelnetEventType[TelnetEventType["TTYPE"] = 10] = "TTYPE";
    TelnetEventType[TelnetEventType["ENVIRON"] = 11] = "ENVIRON";
    TelnetEventType[TelnetEventType["MSSP"] = 12] = "MSSP";
    TelnetEventType[TelnetEventType["WARNING"] = 13] = "WARNING";
    TelnetEventType[TelnetEventType["ERROR"] = 14] = "ERROR";
})(TelnetEventType = exports.TelnetEventType || (exports.TelnetEventType = {}));
var TelnetOption;
(function (TelnetOption) {
    TelnetOption[TelnetOption["BINARY"] = 0] = "BINARY";
    TelnetOption[TelnetOption["ECHO"] = 1] = "ECHO";
    TelnetOption[TelnetOption["RCP"] = 2] = "RCP";
    TelnetOption[TelnetOption["SGA"] = 3] = "SGA";
    TelnetOption[TelnetOption["NAMS"] = 4] = "NAMS";
    TelnetOption[TelnetOption["STATUS"] = 5] = "STATUS";
    TelnetOption[TelnetOption["TM"] = 6] = "TM";
    TelnetOption[TelnetOption["RCTE"] = 7] = "RCTE";
    TelnetOption[TelnetOption["NAOL"] = 8] = "NAOL";
    TelnetOption[TelnetOption["NAOP"] = 9] = "NAOP";
    TelnetOption[TelnetOption["NAOCRD"] = 10] = "NAOCRD";
    TelnetOption[TelnetOption["NAOHTS"] = 11] = "NAOHTS";
    TelnetOption[TelnetOption["NAOHTD"] = 12] = "NAOHTD";
    TelnetOption[TelnetOption["NAOFFD"] = 13] = "NAOFFD";
    TelnetOption[TelnetOption["NAOVTS"] = 14] = "NAOVTS";
    TelnetOption[TelnetOption["NAOVTD"] = 15] = "NAOVTD";
    TelnetOption[TelnetOption["NAOLFD"] = 16] = "NAOLFD";
    TelnetOption[TelnetOption["XASCII"] = 17] = "XASCII";
    TelnetOption[TelnetOption["LOGOUT"] = 18] = "LOGOUT";
    TelnetOption[TelnetOption["BM"] = 19] = "BM";
    TelnetOption[TelnetOption["DET"] = 20] = "DET";
    TelnetOption[TelnetOption["SUPDUP"] = 21] = "SUPDUP";
    TelnetOption[TelnetOption["SUPDUPOUTPUT"] = 22] = "SUPDUPOUTPUT";
    TelnetOption[TelnetOption["SNDLOC"] = 23] = "SNDLOC";
    TelnetOption[TelnetOption["TTYPE"] = 24] = "TTYPE";
    TelnetOption[TelnetOption["EOR"] = 25] = "EOR";
    TelnetOption[TelnetOption["TUID"] = 26] = "TUID";
    TelnetOption[TelnetOption["OUTMRK"] = 27] = "OUTMRK";
    TelnetOption[TelnetOption["TTYLOC"] = 28] = "TTYLOC";
    TelnetOption[TelnetOption["_3270REGIME"] = 29] = "_3270REGIME";
    TelnetOption[TelnetOption["X3PAD"] = 30] = "X3PAD";
    TelnetOption[TelnetOption["NAWS"] = 31] = "NAWS";
    TelnetOption[TelnetOption["TSPEED"] = 32] = "TSPEED";
    TelnetOption[TelnetOption["LFLOW"] = 33] = "LFLOW";
    TelnetOption[TelnetOption["LINEMODE"] = 34] = "LINEMODE";
    TelnetOption[TelnetOption["XDISPLOC"] = 35] = "XDISPLOC";
    TelnetOption[TelnetOption["ENVIRON"] = 36] = "ENVIRON";
    TelnetOption[TelnetOption["AUTHENTICATION"] = 37] = "AUTHENTICATION";
    TelnetOption[TelnetOption["ENCRYPT"] = 38] = "ENCRYPT";
    TelnetOption[TelnetOption["NEW_ENVIRON"] = 39] = "NEW_ENVIRON";
    TelnetOption[TelnetOption["MSSP"] = 70] = "MSSP";
    TelnetOption[TelnetOption["COMPRESS"] = 85] = "COMPRESS";
    TelnetOption[TelnetOption["COMPRESS2"] = 86] = "COMPRESS2";
    TelnetOption[TelnetOption["ZMP"] = 93] = "ZMP";
    TelnetOption[TelnetOption["EXOPL"] = 255] = "EXOPL";
    TelnetOption[TelnetOption["MCCP2"] = 86] = "MCCP2";
})(TelnetOption = exports.TelnetOption || (exports.TelnetOption = {}));
var EnvironCommand;
(function (EnvironCommand) {
    EnvironCommand[EnvironCommand["IS"] = 0] = "IS";
    EnvironCommand[EnvironCommand["SEND"] = 1] = "SEND";
    EnvironCommand[EnvironCommand["INFO"] = 2] = "INFO";
})(EnvironCommand = exports.EnvironCommand || (exports.EnvironCommand = {}));
var TelnetErrorCode;
(function (TelnetErrorCode) {
    /** no error */
    TelnetErrorCode[TelnetErrorCode["OK"] = 0] = "OK";
    /** invalid parameter, or API misuse */
    TelnetErrorCode[TelnetErrorCode["BADVAL"] = 1] = "BADVAL";
    /** memory allocation failure */
    TelnetErrorCode[TelnetErrorCode["NOMEM"] = 2] = "NOMEM";
    /** data exceeds buffer size */
    TelnetErrorCode[TelnetErrorCode["OVERFLOW"] = 3] = "OVERFLOW";
    /** invalid sequence of special bytes */
    TelnetErrorCode[TelnetErrorCode["PROTOCOL"] = 4] = "PROTOCOL";
    /** error handling compressed streams */
    TelnetErrorCode[TelnetErrorCode["COMPRESS"] = 5] = "COMPRESS";
})(TelnetErrorCode = exports.TelnetErrorCode || (exports.TelnetErrorCode = {}));
//# sourceMappingURL=consts.js.map