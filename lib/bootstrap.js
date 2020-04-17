"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
function createImports() {
    return {
        env: {
            _init: function (data_t_buffer_offset, data_t_size_offset, error_t_file_offset, error_t_func_offset, error_t_msg_offset, error_t_line_offset, error_t_errcode_offset, iac_t_cmd_offset, negotiate_t_telopt_offset, subnegotiate_t_buffer_offset, subnegotiate_t_size_offset, subnegotiate_t_telopt_offset, zmp_t_argc_offset, zmp_t_argv_offset, ttype_t_cmd_offset, ttype_t_name_offset, compress_t_state_offset, environ_t_values_offset, environ_t_size_offset, environ_t_cmd_offset, telnet_environ_t_type_offset, telnet_environ_t_var_offset, telnet_environ_t_value_offset, mssp_t_values_offset, mssp_t_size_offset) {
                var a = require("./consts").consts;
                a.data_t_buffer_offset = data_t_buffer_offset;
                a.data_t_size_offset = data_t_size_offset;
                a.error_t_file_offset = error_t_file_offset;
                a.error_t_func_offset = error_t_func_offset;
                a.error_t_msg_offset = error_t_msg_offset;
                a.error_t_line_offset = error_t_line_offset;
                a.error_t_errcode_offset = error_t_errcode_offset;
                a.iac_t_cmd_offset = iac_t_cmd_offset;
                a.negotiate_t_telopt_offset = negotiate_t_telopt_offset;
                a.subnegotiate_t_buffer_offset = subnegotiate_t_buffer_offset;
                a.subnegotiate_t_size_offset = subnegotiate_t_size_offset;
                a.subnegotiate_t_telopt_offset = subnegotiate_t_telopt_offset;
                a.zmp_t_argc_offset = zmp_t_argc_offset;
                a.zmp_t_argv_offset = zmp_t_argv_offset;
                a.ttype_t_cmd_offset = ttype_t_cmd_offset;
                a.ttype_t_name_offset = ttype_t_name_offset;
                a.compress_t_state_offset = compress_t_state_offset;
                a.environ_t_values_offset = environ_t_values_offset;
                a.environ_t_size_offset = environ_t_size_offset;
                a.environ_t_cmd_offset = environ_t_cmd_offset;
                a.telnet_environ_t_type_offset = telnet_environ_t_type_offset;
                a.telnet_environ_t_var_offset = telnet_environ_t_var_offset;
                a.telnet_environ_t_value_offset = telnet_environ_t_value_offset;
                a.mssp_t_values_offset = mssp_t_values_offset;
                a.mssp_t_size_offset = mssp_t_size_offset;
            },
            generic_event_handler: function (telnet, event) {
                require("./Telnet").Telnet.route(telnet, event);
            },
        },
    };
}
function init(runtime) {
    var api = runtime.instance.exports;
    api.init();
    return runtime;
}
var runtime;
exports.runtime = runtime;
if (typeof require === "function") {
    var fs_1 = require("fs");
    var readFile = fs_1.promises
        ? fs_1.promises.readFile
        : function (strPath) {
            return new Promise(function (resolve, reject) {
                fs_1.readFile(strPath, function (err, buffer) {
                    if (err)
                        reject(err);
                    else
                        resolve(buffer);
                });
            });
        };
    var path = require("path");
    var wasmPath = path.resolve(__dirname, "../build/libtelnet.wasm");
    exports.runtime = runtime = readFile(wasmPath)
        .then(function (buffer) {
        return WebAssembly.instantiate(buffer, createImports());
    })
        .then(init);
}
else if (typeof fetch === "function") {
    exports.runtime = runtime = WebAssembly.instantiateStreaming(fetch("libtelnet.wasm"), createImports()).then(init);
}
else {
    throw new Error("Must have valid global fetch or require function to bootstrap the runtime.");
}
//# sourceMappingURL=bootstrap.js.map