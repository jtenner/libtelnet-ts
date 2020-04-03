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

export interface IDataEvent {
  readonly type: TelnetEventType;
  readonly buffer: Uint8Array;
  readonly size: number;
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
}

export namespace TelnetEvent {
  export let data_t_buffer_offset: number = 0;
  export let data_t_size_offset: number = 0;
}
