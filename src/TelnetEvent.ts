import { consts } from "./consts";

const telnet = require("../build/libtelnet");

const U32_ALIGN = 2;

function getEnvironVars(
  pointer: number,
  size: number,
  heap: DataView,
): IEnvironVar[] {
  const result: IEnvironVar[] = [];

  for (let i = 0; i < size; i++) {
    const environVarPointer = heap.getUint32(pointer + (i << U32_ALIGN));
    const valueStringPointer = heap.getUint32(
      environVarPointer + consts.telnet_environ_t_value_offset,
    );
    const varStringPointer = heap.getUint32(
      environVarPointer + consts.telnet_environ_t_var_offset,
    );
    result.push({
      type: heap.getUint8(
        environVarPointer + consts.telnet_environ_t_type_offset,
      ),
      value: telnet.UTF8ToString(valueStringPointer),
      var: telnet.UTF8ToString(varStringPointer),
    });
  }

  return result;
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

export type NegotiationEvent =
  | TelnetEventType.WILL
  | TelnetEventType.WONT
  | TelnetEventType.DO
  | TelnetEventType.DONT;

export type ErrorEvent = TelnetEventType.ERROR | TelnetEventType.WARNING;

export type DataEvent = TelnetEventType.DATA | TelnetEventType.SEND;

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

export interface IData {
  readonly type: DataEvent;
  readonly buffer: Uint8Array;
  readonly size: number;
}

export interface IError {
  readonly type: ErrorEvent;
  readonly file: string;
  readonly func: string;
  readonly msg: string;
  readonly line: number;
  readonly errcode: TelnetErrorCode;
}

export interface IIAC {
  readonly type: TelnetEventType.IAC;
  readonly cmd: TelnetOption;
}

export interface INegotiation {
  readonly type: NegotiationEvent;
  readonly telopt: TelnetOption;
}

export interface ISubnegotiation {
  readonly type: TelnetEventType.SUBNEGOTIATION;
  readonly buffer: Uint8Array;
  readonly size: number;
  readonly telopt: TelnetOption;
}

export interface IZMP {
  readonly type: TelnetEventType.ZMP;
  readonly argv: string[];
  readonly argc: number;
}

export interface ICompress {
  readonly type: TelnetEventType.COMPRESS;
  readonly state: boolean;
}

export interface IEnviron {
  readonly type: TelnetEventType.ENVIRON;
  readonly values: IEnvironVar[];
  readonly size: number;
  readonly cmd: EnvironCommand;
}

export interface IMSSP {
  readonly type: TelnetEventType.MSSP;
  readonly values: IEnvironVar[];
  readonly size: number;
}

export enum EnvironVarType {
  VAR = 0,
  VALUE = 1,
  ESC = 2,
  USERVAR = 3,
}

export interface IEnvironVar {
  readonly type: EnvironVarType;
  readonly var: string;
  readonly value: string;
}

export enum TType {
  IS = 0,
  SEND = 1,
}

export interface ITType {
  readonly type: TelnetEventType.TTYPE;
  readonly cmd: TType;
  readonly name: string;
}

export class TelnetEvent {
  public type: TelnetEventType;
  public constructor(public pointer: number, private heap: DataView) {
    this.type = heap.getUint32(pointer, true);
  }

  /**
   * Interpret this event as a data event. Either TelnetEventType.{Data | Send}.
   *
   * struct data_t {
   *   enum telnet_event_type_t _type;
   *   const char *buffer;
   *   size_t size;
   * } data;
   */
  public get data(): IData {
    const pointer = this.pointer;
    const bufferPointer = this.heap.getUint32(
      pointer + consts.data_t_buffer_offset,
      true,
    );
    const bufferLength = this.heap.getUint32(
      pointer + consts.data_t_size_offset,
      true,
    );
    return {
      type: this.type as DataEvent,
      buffer: new Uint8Array(
        this.heap.buffer.slice(bufferPointer, bufferPointer + bufferLength),
      ),
      size: bufferLength,
    };
  }

  /**
   * Interpret this event as an error.
   */
  public get error(): IError {
    const heap = this.heap;
    const filePointer = heap.getUint32(
      this.pointer + consts.error_t_file_offset,
    );
    const funcPointer = heap.getUint32(
      this.pointer + consts.error_t_func_offset,
    );
    const messagePointer = heap.getUint32(
      this.pointer + consts.error_t_msg_offset,
    );
    const line = heap.getUint32(this.pointer + consts.error_t_line_offset);
    const errcode: TelnetErrorCode = heap.getUint32(
      this.pointer + consts.error_t_errcode_offset,
    );

    return {
      errcode: errcode,
      file: telnet.UTF8ToString(filePointer),
      func: telnet.UTF8ToString(funcPointer),
      line,
      msg: telnet.UTF8ToString(messagePointer),
      type: this.type as ErrorEvent,
    };
  }

  public get iac(): IIAC {
    return {
      type: this.type as TelnetEventType.IAC,
      cmd: this.heap.getUint8(this.pointer + consts.iac_t_cmd_offset),
    };
  }

  public get negotiate(): INegotiation {
    return {
      type: this.type as NegotiationEvent,
      telopt: this.heap.getUint8(
        this.pointer + consts.negotiate_t_telopt_offset,
      ),
    };
  }

  public get subnegotiate(): ISubnegotiation {
    const heap = this.heap;
    const pointer = this.pointer;
    const bufferPointer = heap.getUint32(
      pointer + consts.subnegotiate_t_buffer_offset,
    );
    const size = heap.getUint32(pointer + consts.subnegotiate_t_size_offset);
    const telopt: TelnetOption = heap.getUint8(
      pointer + consts.subnegotiate_t_telopt_offset,
    );
    return {
      buffer: new Uint8Array(this.heap.buffer, bufferPointer, size),
      size,
      telopt,
      type: this.type as TelnetEventType.SUBNEGOTIATION,
    };
  }

  public get zmp(): IZMP {
    const heap = this.heap;
    const pointer = this.pointer;
    const argc = heap.getUint32(pointer + consts.zmp_t_argc_offset);
    // pointer + argv_offset is the memory location for the array of pointers
    const argvPointer = heap.getUint32(pointer + consts.zmp_t_argv_offset);
    const argv: string[] = [];

    for (let i = 0; i < argc; i++) {
      // dereference the pointer at argvPointer + (i << alignof<u32>())
      const stringPointer = heap.getUint32(argvPointer + (i << U32_ALIGN));
      const value = telnet.UTF8ToString(stringPointer);
      argv.push(value);
    }

    return {
      argc,
      argv,
      type: this.type as TelnetEventType.ZMP,
    };
  }

  public get ttype(): ITType {
    const heap = this.heap;
    const pointer = this.pointer;
    const cmd: TType = heap.getUint8(pointer + consts.ttype_t_cmd_offset);
    const namePointer = heap.getUint8(pointer + consts.ttype_t_name_offset);
    return {
      cmd,
      name: telnet.UTF8ToString(namePointer),
      type: this.type as TelnetEventType.TTYPE,
    };
  }

  public get compress(): ICompress {
    return {
      type: this.type as TelnetEventType.COMPRESS,
      state:
        this.heap.getUint8(this.pointer + consts.compress_t_state_offset) === 1,
    };
  }

  public get environ(): IEnviron {
    const pointer = this.pointer;
    const heap = this.heap;
    const cmd: EnvironCommand = heap.getUint8(
      pointer + consts.environ_t_cmd_offset,
    );
    const size = heap.getUint32(pointer + consts.environ_t_size_offset);
    const valuesPointer = heap.getUint32(
      pointer + consts.environ_t_values_offset,
    );
    const values = getEnvironVars(valuesPointer, size, heap);

    return {
      cmd,
      size,
      values,
      type: this.type as TelnetEventType.ENVIRON,
    };
  }

  public get mssp(): IMSSP {
    const pointer = this.pointer;
    const heap = this.heap;
    const size = heap.getUint32(pointer + consts.environ_t_size_offset);
    const valuesPointer = heap.getUint32(
      pointer + consts.environ_t_values_offset,
    );
    const values = getEnvironVars(valuesPointer, size, heap);

    return {
      size,
      values,
      type: this.type as TelnetEventType.MSSP,
    };
  }
}
