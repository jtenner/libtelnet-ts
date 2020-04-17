import { TelnetAPI } from "./TelnetAPI";

function createImports(): any {
  return {
    env: {
      _init(
        data_t_buffer_offset: number,
        data_t_size_offset: number,
        error_t_file_offset: number,
        error_t_func_offset: number,
        error_t_msg_offset: number,
        error_t_line_offset: number,
        error_t_errcode_offset: number,
        iac_t_cmd_offset: number,
        negotiate_t_telopt_offset: number,
        subnegotiate_t_buffer_offset: number,
        subnegotiate_t_size_offset: number,
        subnegotiate_t_telopt_offset: number,
        zmp_t_argc_offset: number,
        zmp_t_argv_offset: number,
        ttype_t_cmd_offset: number,
        ttype_t_name_offset: number,
        compress_t_state_offset: number,
        environ_t_values_offset: number,
        environ_t_size_offset: number,
        environ_t_cmd_offset: number,
        telnet_environ_t_type_offset: number,
        telnet_environ_t_var_offset: number,
        telnet_environ_t_value_offset: number,
        mssp_t_values_offset: number,
        mssp_t_size_offset: number,
      ) {
        const a = require("./consts").consts;
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
      generic_event_handler(telnet: number, event: number) {
        require("./Telnet").Telnet.route(telnet, event);
      },
    },
  };
}
type InstantiationResult = Promise<WebAssembly.WebAssemblyInstantiatedSource>;
function init(
  runtime: WebAssembly.WebAssemblyInstantiatedSource,
): WebAssembly.WebAssemblyInstantiatedSource {
  const api = (runtime.instance.exports as unknown) as TelnetAPI;
  api.init();
  return runtime;
}

let runtime: InstantiationResult;

if (typeof require === "function") {
  const fs = require("fs");
  const readFile = fs.promises
    ? fs.promises.readFile
    : (strPath: string) =>
        new Promise((resolve, reject) => {
          fs.readFile(strPath, (err: any, buffer: Uint8Array) => {
            if (err) reject(err);
            else resolve(buffer);
          });
        });
  const path = require("path");
  const wasmPath = path.resolve(__dirname, "../build/libtelnet.wasm");
  runtime = readFile(wasmPath)
    .then((buffer: Buffer) => {
      return WebAssembly.instantiate(buffer, createImports());
    })
    .then(init);
} else if (typeof fetch === "function") {
  runtime = WebAssembly.instantiateStreaming(
    fetch("libtelnet.wasm") as Promise<Response>,
    createImports(),
  ).then(init);
} else {
  throw new Error(
    "Must have valid global fetch or require function to bootstrap the runtime.",
  );
}

export { runtime };
