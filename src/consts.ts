// This set of constants are controlled by the init() function in libtelnet.c
export namespace consts {
  export let data_t_buffer_offset: number = 0;
  export let data_t_size_offset: number = 0;
  export let error_t_file_offset: number = 0;
  export let error_t_func_offset: number = 0;
  export let error_t_msg_offset: number = 0;
  export let error_t_line_offset: number = 0;
  export let error_t_errcode_offset: number = 0;
  export let iac_t_cmd_offset: number = 0;
  export let negotiate_t_telopt_offset: number = 0;
  export let subnegotiate_t_buffer_offset: number = 0;
  export let subnegotiate_t_size_offset: number = 0;
  export let subnegotiate_t_telopt_offset: number = 0;
  export let zmp_t_argc_offset: number = 0;
  export let zmp_t_argv_offset: number = 0;
  export let ttype_t_cmd_offset: number = 0;
  export let ttype_t_name_offset: number = 0;
  export let compress_t_state_offset: number = 0;
  export let environ_t_values_offset: number = 0;
  export let environ_t_size_offset: number = 0;
  export let environ_t_cmd_offset: number = 0;
  export let telnet_environ_t_type_offset: number = 0;
  export let telnet_environ_t_var_offset: number = 0;
  export let telnet_environ_t_value_offset: number = 0;
  export let telnet_telopt_t_telopt_offset: number = 0;
  export let telnet_telopt_t_us_offset: number = 0;
  export let telnet_telopt_t_him_offset: number = 0;
}

export enum TelnetCommand {
  IAC = 255,
  DONT = 254,
  DO = 253,
  WONT = 252,
  WILL = 251,
  SB = 250,
  GA = 249,
  EL = 248,
  EC = 247,
  AYT = 246,
  AO = 245,
  IP = 244,
  BREAK = 243,
  DM = 242,
  NOP = 241,
  SE = 240,
  EOR = 239,
  ABORT = 238,
  SUSP = 237,
  EOF = 236,
}

export type TelnetNegotiationCommand =
  | TelnetCommand.DO
  | TelnetCommand.DONT
  | TelnetCommand.WILL
  | TelnetCommand.WONT;

export enum TelnetFlag {
  NONE = 0,
  PROXY = 1 << 0,
  NVT_EOL = 1 << 1,
}

export enum TelnetEventType {
  DATA = 0,
  SEND,
  IAC,
  WILL,
  WONT,
  DO,
  DONT,
  SUBNEGOTIATION,
  COMPRESS,
  ZMP,
  TTYPE,
  ENVIRON,
  MSSP,
  WARNING,
  ERROR,
}

export enum TelnetOption {
  BINARY = 0,
  ECHO = 1,
  RCP = 2,
  SGA = 3,
  NAMS = 4,
  STATUS = 5,
  TM = 6,
  RCTE = 7,
  NAOL = 8,
  NAOP = 9,
  NAOCRD = 10,
  NAOHTS = 11,
  NAOHTD = 12,
  NAOFFD = 13,
  NAOVTS = 14,
  NAOVTD = 15,
  NAOLFD = 16,
  XASCII = 17,
  LOGOUT = 18,
  BM = 19,
  DET = 20,
  SUPDUP = 21,
  SUPDUPOUTPUT = 22,
  SNDLOC = 23,
  TTYPE = 24,
  EOR = 25,
  TUID = 26,
  OUTMRK = 27,
  TTYLOC = 28,
  _3270REGIME = 29,
  X3PAD = 30,
  NAWS = 31,
  TSPEED = 32,
  LFLOW = 33,
  LINEMODE = 34,
  XDISPLOC = 35,
  ENVIRON = 36,
  AUTHENTICATION = 37,
  ENCRYPT = 38,
  NEW_ENVIRON = 39,
  MSSP = 70,
  COMPRESS = 85,
  COMPRESS2 = 86,
  ZMP = 93,
  EXOPL = 255,
  MCCP2 = 86,
}

export enum EnvironCommand {
  IS = 0,
  SEND = 1,
  INFO = 2,
}

export type NegotiationEventType =
  | TelnetEventType.WILL
  | TelnetEventType.WONT
  | TelnetEventType.DO
  | TelnetEventType.DONT;

export type ErrorEventType = TelnetEventType.ERROR | TelnetEventType.WARNING;

export type DataEventType = TelnetEventType.DATA | TelnetEventType.SEND;

export enum TelnetErrorCode {
  /** no error */
  OK = 0,
  /** invalid parameter, or API misuse */
  BADVAL,
  /** memory allocation failure */
  NOMEM,
  /** data exceeds buffer size */
  OVERFLOW,
  /** invalid sequence of special bytes */
  PROTOCOL,
  /** error handling compressed streams */
  COMPRESS,
}
