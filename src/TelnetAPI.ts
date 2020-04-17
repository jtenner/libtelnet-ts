import {
  TelnetFlag,
  TelnetCommand,
  TelnetOption,
  TelnetNegotiationCommand,
} from "./consts";

export interface TelnetAPI {
  memory: WebAssembly.Memory;
  free(pointer: number): void;
  init(): void;
  malloc(size: number): number;
  telnet_free(telnet: number): void;
  telnet_iac(telnet: number, cmd: TelnetCommand): void;
  telnet_init(compatibilityTable: number, flags: TelnetFlag): number;
  telnet_negotiate(
    telnet: number,
    cmd: TelnetNegotiationCommand,
    option: TelnetOption,
  ): void;
  telnet_recv(telnet: number, buffer: number, size: number): void;
  telnet_send_text(telnet: number, buffer: number, length: number): void;
  telnet_send(telnet: number, buffer: number, length: number): void;
  telnet_subnegotiation(
    telnet: number,
    telopt: TelnetOption,
    buffer: number,
    size: number,
  ): void;
  telnet_begin_compress2(telnet: number): void;
  telnet_send_zmp(telnet: number, argc: number, argv: number): void;
}
