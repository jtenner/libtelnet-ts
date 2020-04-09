import {
  TelnetFlag,
  TelnetCommand,
  TelnetOption,
  TelnetNegotiationCommand,
} from "./consts";

export interface TelnetAPI {
  _free(pointer: number): void;
  _init(): void;
  _malloc(size: number): number;
  _telnet_free(telnet: number): void;
  _telnet_iac(telnet: number, cmd: TelnetCommand): void;
  _telnet_init(compatibilityTable: number, flags: TelnetFlag): number;
  _telnet_negotiate(
    telnet: number,
    cmd: TelnetNegotiationCommand,
    option: TelnetOption,
  ): void;
  _telnet_recv(telnet: number, buffer: number, size: number): void;
  _telnet_send_text(telnet: number, buffer: number, length: number): void;
  _telnet_send(telnet: number, buffer: number, length: number): void;
  _telnet_subnegotiation(
    telnet: number,
    telopt: TelnetOption,
    buffer: number,
    size: number,
  ): void;
  HEAPU8: Uint8Array;
  lengthBytesUTF8(str: string): number;
  onRuntimeInitialized(): void;
  UTF8ToString(ptr: number): string;
  AsciiToString(ptr: number): string;
  writeAsciiToMemory(
    ptr: number,
    str: string,
    notNullTerminated: boolean,
  ): void;
  _telnet_begin_compress2(telnet: number): void;
  _telnet_send_zmp(telnet: number, argc: number, argv: number): void;
}
