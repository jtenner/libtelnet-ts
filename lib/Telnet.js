"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telnet = void 0;
var telnet = require("../build/libtelnet");
var Telnet = /** @class */ (function () {
    function Telnet() {
        this.pointer = telnet.telnet_init(0, 0, 0, 0);
        console.log(this.pointer);
    }
    return Telnet;
}());
exports.Telnet = Telnet;
//# sourceMappingURL=Telnet.js.map