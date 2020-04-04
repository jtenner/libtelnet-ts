const telnet = require("../build/libtelnet");

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

export interface IDataEvent {
  readonly type: TelnetEventType;
  readonly buffer: Uint8Array;
  readonly size: number;
}

export interface IErrorEvent {
  readonly type: TelnetEventType;
  readonly file: string;
  readonly func: string;
  readonly message: string;
  readonly line: number;
  readonly errcode: TelnetErrorCode;
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
  public get data(): IDataEvent {
    const pointer = this.pointer;
    const bufferPointer = this.heap.getUint32(
      pointer + TelnetEvent.data_t_buffer_offset,
      true,
    );
    const bufferLength = this.heap.getUint32(
      pointer + TelnetEvent.data_t_size_offset,
      true,
    );
    return {
      type: this.type,
      buffer: new Uint8Array(
        this.heap.buffer.slice(bufferPointer, bufferPointer + bufferLength),
      ),
      size: bufferLength,
    };
  }

  /**
   * Interpret this event as an error.
   *
   * struct error_t {
   *  enum telnet_event_type_t _type
   *  const char *file;
   *  const char *func;
   *  const char *msg;
   *  int line;
   *  telnet_error_t errcode;
   * }
   */
  public get error(): IErrorEvent {
    const heap = this.heap;
    const filePointer = heap.getUint32(
      this.pointer + TelnetEvent.error_t_file_offset,
    );
    const funcPointer = heap.getUint32(
      this.pointer + TelnetEvent.error_t_func_offset,
    );
    const messagePointer = heap.getUint32(
      this.pointer + TelnetEvent.error_t_msg_offset,
    );
    const line = heap.getUint32(this.pointer + TelnetEvent.error_t_line_offset);
    const errcode: TelnetErrorCode = heap.getUint32(
      this.pointer + TelnetEvent.error_t_errcode_offset,
    );

    return {
      errcode: errcode,
      file: telnet.UTF8ToString(filePointer),
      func: telnet.UTF8ToString(funcPointer),
      line,
      message: telnet.UTF8ToString(messagePointer),
      type: this.type,
    };
  }
}

export namespace TelnetEvent {
  export let data_t_buffer_offset: number = 0;
  export let data_t_size_offset: number = 0;
  export let error_t_file_offset: number = 0;
  export let error_t_func_offset: number = 0;
  export let error_t_msg_offset: number = 0;
  export let error_t_line_offset: number = 0;
  export let error_t_errcode_offset: number = 0;
}
