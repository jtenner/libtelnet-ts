import {
  consts,
  DataEventType,
  TelnetErrorCode,
  TelnetEventType,
  TelnetOption,
  NegotiationEventType,
  EnvironCommand,
  ErrorEventType,
  TelnetCommand,
} from "./consts";
import { TelnetAPI } from "./TelnetAPI";
import { AsciiToString, getDataView, getHeapU8 } from "./util";
import { runtime } from "./bootstrap";

/** The imported emscripten api that calls the c lib functions. */
let telnet: TelnetAPI;
runtime.then((e) => {
  telnet = e.instance.exports as any;
});

/** Collect a set of environ vars from a telnet_environ_t*. */
function getEnvironVars(
  pointer: number,
  size: number,
  heap: DataView,
): IEnvironVar[] {
  const result: IEnvironVar[] = [];
  for (let i = 0; i < size; i++, pointer += 12) {
    const valueStringPointer = heap.getUint32(
      pointer + consts.telnet_environ_t_value_offset,
      true,
    );
    const varStringPointer = heap.getUint32(
      pointer + consts.telnet_environ_t_var_offset,
      true,
    );
    result.push({
      type: heap.getUint8(pointer + consts.telnet_environ_t_type_offset),
      value:
        valueStringPointer === 0
          ? null
          : AsciiToString(telnet, valueStringPointer),
      var:
        varStringPointer === 0 ? null : AsciiToString(telnet, varStringPointer),
    });
  }

  return result;
}

/** A data event. Can be incoming as `TelnetEventType.DATA` or outgoing `TelnetEventType.SEND`. */
export interface IDataEvent {
  readonly type: DataEventType;
  readonly buffer: Uint8Array;
  readonly size: number;
}

/** An error event, can be a `TelnetEventType.WARNING` or an `TelnetEventType.ERROR`. */
export interface IErrorEvent {
  readonly type: ErrorEventType;
  readonly file: string | null;
  readonly func: string | null;
  readonly msg: string | null;
  readonly line: number;
  readonly errcode: TelnetErrorCode;
}

/** An IAC event with the given command. */
export interface IIACEvent {
  readonly type: TelnetEventType.IAC;
  readonly cmd: TelnetCommand;
}

/** A telnet negotation event of type DO, DONT, WILL, or WONT. */
export interface INegotiationEvent {
  readonly type: NegotiationEventType;
  readonly telopt: TelnetOption;
}

/** A subnegotiation with an option and a payload. */
export interface ISubnegotiationEvent {
  readonly type: TelnetEventType.SUBNEGOTIATION;
  readonly buffer: Uint8Array;
  readonly size: number;
  readonly telopt: TelnetOption;
}

/** ZMP event. */
export interface IZMPEvent {
  readonly type: TelnetEventType.ZMP;
  readonly argv: Array<string | null>;
  readonly argc: number;
}

/** A compression event. */
export interface ICompressEvent {
  readonly type: TelnetEventType.COMPRESS;
  readonly state: boolean;
}

/** An environ event, with a set of IEnvironVar values and an Environ Command. */
export interface IEnvironEvent {
  readonly type: TelnetEventType.ENVIRON;
  readonly values: IEnvironVar[];
  readonly size: number;
  readonly cmd: EnvironCommand;
}

/** An MSSPEvent. */
export interface IMSSPEvent {
  readonly type: TelnetEventType.MSSP;
  readonly values: IEnvironVar[];
  readonly size: number;
}

/** The environ var types. */
export enum EnvironVarType {
  VAR = 0,
  VALUE = 1,
  ESC = 2,
  USERVAR = 3,
}

/** An Environ var. */
export interface IEnvironVar {
  readonly type: EnvironVarType;
  readonly var: string | null;
  readonly value: string | null;
}

/** TType Command. */
export enum TTypeCommand {
  IS = 0,
  SEND = 1,
}

/** A TType event. */
export interface ITType {
  readonly type: TelnetEventType.TTYPE;
  readonly cmd: TTypeCommand;
  readonly name: string;
}

/**
 * A basis for all telnet events. Internal use only. It uses the internal
 * properties to "Cast" the event to the appropriate type.
 */
export class TelnetEvent {
  /** The telnet event type. */
  public type: TelnetEventType;

  public constructor(public pointer: number) {
    const heap = getDataView(telnet);
    this.type = heap.getUint32(pointer, true);
  }

  /**
   * Interpret this event as a data event. Either TelnetEventType.{Data | Send}.
   *
   * struct data_t {
   *   enum telnet_event_type_t _type; -> EventType
   *   const char *buffer; -> string
   *   size_t size; -> number
   * } data;
   */
  public get data(): IDataEvent {
    const pointer = this.pointer;
    const heap = getDataView(telnet);
    const bufferPointer = heap.getUint32(
      pointer + consts.data_t_buffer_offset,
      true,
    );
    const bufferLength = heap.getUint32(
      pointer + consts.data_t_size_offset,
      true,
    );
    return {
      type: this.type as DataEventType,
      buffer: new Uint8Array(
        heap.buffer.slice(bufferPointer, bufferPointer + bufferLength),
      ),
      size: bufferLength,
    };
  }

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
  public get error(): IErrorEvent {
    const heap = getDataView(telnet);
    const filePointer = heap.getUint32(
      this.pointer + consts.error_t_file_offset,
      true,
    );
    const funcPointer = heap.getUint32(
      this.pointer + consts.error_t_func_offset,
      true,
    );
    const messagePointer = heap.getUint32(
      this.pointer + consts.error_t_msg_offset,
      true,
    );
    const line = heap.getUint32(
      this.pointer + consts.error_t_line_offset,
      true,
    );
    const errcode: TelnetErrorCode = heap.getUint32(
      this.pointer + consts.error_t_errcode_offset,
      true,
    );

    return {
      errcode: errcode,
      file: AsciiToString(telnet, filePointer),
      func: AsciiToString(telnet, funcPointer),
      line,
      msg: AsciiToString(telnet, messagePointer),
      type: this.type as ErrorEventType,
    };
  }

  /**
   * Interpret this event as an IAC (Interpret as Command)
   *
   * struct iac_t {
   *   enum telnet_event_type_t _type; -> TelnetEventType
   *   unsigned char cmd; -> TelnetOption
   * } iac;
   */
  public get iac(): IIACEvent {
    return {
      type: this.type as TelnetEventType.IAC,
      cmd: getDataView(telnet).getUint8(
        this.pointer + consts.iac_t_cmd_offset,
      ) as TelnetCommand,
    };
  }

  /**
   * Interpret this event as a Negotiation event. I.E. DO, DONT, WILL, WONT
   *
   * struct negotiate_t {
   *   enum telnet_event_type_t _type; -> TelnetEventType
   *   unsigned char telopt; -> TelnetOption
   * } neg;
   */
  public get negotiate(): INegotiationEvent {
    return {
      type: this.type as NegotiationEventType,
      telopt: getHeapU8(telnet)[
        this.pointer + consts.negotiate_t_telopt_offset
      ],
    };
  }

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
  public get sub(): ISubnegotiationEvent {
    const heap = getDataView(telnet);
    const pointer = this.pointer;
    const bufferPointer = heap.getUint32(
      pointer + consts.subnegotiate_t_buffer_offset,
      true,
    );
    const size = heap.getUint32(
      pointer + consts.subnegotiate_t_size_offset,
      true,
    );
    const telopt: TelnetOption = heap.getUint8(
      pointer + consts.subnegotiate_t_telopt_offset,
    );
    return {
      buffer: new Uint8Array(heap.buffer, bufferPointer, size),
      size,
      telopt,
      type: this.type as TelnetEventType.SUBNEGOTIATION,
    };
  }

  /**
   * Interpret this event as a ZMP event.
   *
   * struct zmp_t {
   *   enum telnet_event_type_t _type; -> TelnetEventType
   *   const char **argv; -> string[]
   *   size_t argc; -> number
   * } zmp;
   */
  public get zmp(): IZMPEvent {
    const heap = getDataView(telnet);
    const pointer = this.pointer;
    const argc = heap.getUint32(pointer + consts.zmp_t_argc_offset, true);
    // pointer + argv_offset is the memory location for the array of pointers
    const argvPointer = heap.getUint32(
      pointer + consts.zmp_t_argv_offset,
      true,
    );
    const argv: Array<string | null> = [];

    for (let i = 0; i < argc; i++) {
      // dereference the pointer at argvPointer + (i << alignof<u32>())
      const stringPointer = heap.getUint32(
        argvPointer + (i << consts.U32_ALIGN),
        true,
      );
      const value = AsciiToString(telnet, stringPointer);
      argv.push(value);
    }

    return {
      argc,
      argv,
      type: this.type as TelnetEventType.ZMP,
    };
  }

  /**
   * Interpret this event as a TType event.
   *
   * struct ttype_t {
   *   enum telnet_event_type_t _type; -> TelnetEventType
   *   unsigned char cmd; -> TTypeCommand
   *   const char* name; -> string
   * } ttype;
   */
  public get ttype(): ITType {
    const heap = getDataView(telnet);
    const pointer = this.pointer;
    const cmd: TTypeCommand = heap.getUint8(
      pointer + consts.ttype_t_cmd_offset,
    );
    const namePointer = heap.getUint32(
      pointer + consts.ttype_t_name_offset,
      true,
    );

    const name = AsciiToString(telnet, namePointer) || "";
    return {
      cmd,
      name,
      type: this.type as TelnetEventType.TTYPE,
    };
  }

  /**
   * Interpet this event as a Compress event.
   *
   * struct compress_T {
   *   enum telnet_event_type_t _type; -> TelnetEventType
   *   unsigned char state; -> boolean
   * } compress;
   */
  public get compress(): ICompressEvent {
    return {
      type: this.type as TelnetEventType.COMPRESS,
      state:
        getHeapU8(telnet)[this.pointer + consts.compress_t_state_offset] === 1,
    };
  }

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
  public get environ(): IEnvironEvent {
    const pointer = this.pointer;
    const heap = getDataView(telnet);
    const cmd: EnvironCommand = heap.getUint8(
      pointer + consts.environ_t_cmd_offset,
    );
    const size = heap.getUint32(pointer + consts.environ_t_size_offset, true);
    const valuesPointer = heap.getUint32(
      pointer + consts.environ_t_values_offset,
      true,
    );
    const values = getEnvironVars(valuesPointer, size, heap);

    return {
      cmd,
      size,
      values,
      type: this.type as TelnetEventType.ENVIRON,
    };
  }

  /**
   * Interpret this event as a MSSP event.
   *
   * struct mssp_t {
   *   enum telnet_event_type_t _type; -> TelnetEventType
   *   const struct telnet_environ_t *values; -> IEnvironVar[]
   *   size_t size; -> number
   * } mssp;
   */
  public get mssp(): IMSSPEvent {
    const pointer = this.pointer;
    const heap = getDataView(telnet);
    const size = heap.getUint32(pointer + consts.mssp_t_size_offset, true);
    const valuesPointer = heap.getUint32(
      pointer + consts.mssp_t_values_offset,
      true,
    );
    const values = getEnvironVars(valuesPointer, size, heap);

    return {
      size,
      values,
      type: this.type as TelnetEventType.MSSP,
    };
  }
}
