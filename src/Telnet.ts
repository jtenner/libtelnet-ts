import {
  TelnetEvent,
  INegotiationEvent,
  IIACEvent,
  IDataEvent,
  IErrorEvent,
  ISubnegotiationEvent,
  IZMPEvent,
  ITType,
  ICompressEvent,
  IEnvironEvent,
  IMSSPEvent,
} from "./TelnetEvent";
import { EventEmitter } from "events";
import {
  consts,
  TelnetFlag,
  TelnetOption,
  TelnetEventType,
  TelnetCommand,
  TelnetNegotiationCommand,
} from "./consts";
import { TelnetAPI } from "./TelnetAPI";

const telnet = require("../build/libtelnet") as TelnetAPI;

export type CompatiblityTable = [TelnetOption, boolean, boolean][];

/**
 * A state machine that implements the telnet specification and calls out into
 * web assembly to encode and decode messages from a socket.
 */
export class Telnet extends EventEmitter {
  /**
   * When the runtime is finally initialized, this promise will resolve,
   * and telnet objects can finally be instantiated.
   */
  public static ready = new Promise((resolve) => {
    telnet.onRuntimeInitialized = function () {
      telnet._init();
      resolve();
    };
  });

  /** A map of pointers to their respective Telnet objects for event routing. */
  private static map = new Map<number, Telnet>();

  /** A collection of pointers to be freed when this Telnet object is disposed. */
  private _toFree: number[] = [];

  /** A routing function that gets called from web assembly when a Telnet object must fire an event. */
  public static route(
    telnet: number,
    eventPointer: number,
    _userDataPointer: number,
  ): boolean {
    let target = Telnet.map.get(telnet);
    if (!target) throw new Error("Invalid event target.");
    const event = Telnet.getEvent(eventPointer);

    switch (event.type) {
      case TelnetEventType.DO:
      case TelnetEventType.DONT:
      case TelnetEventType.WILL:
      case TelnetEventType.WONT: {
        return target.emit("negotiate", event.negotiate);
      }
      case TelnetEventType.IAC: {
        return target.emit("iac", event.iac);
      }
      case TelnetEventType.DATA: {
        return target.emit("data", event.data);
      }
      case TelnetEventType.SEND: {
        return target.emit("send", event.data);
      }
      case TelnetEventType.WARNING:
      case TelnetEventType.ERROR: {
        return target.emit("error", event.error);
      }
      case TelnetEventType.SUBNEGOTIATION: {
        return target.emit("sb", event.sub);
      }
      case TelnetEventType.ZMP: {
        return target.emit("zmp", event.zmp);
      }
      case TelnetEventType.TTYPE: {
        return target.emit("ttype", event.ttype);
      }
      case TelnetEventType.COMPRESS: {
        return target.emit("compress", event.compress);
      }
      case TelnetEventType.ENVIRON: {
        return target.emit("environ", event.environ);
      }
      case TelnetEventType.MSSP: {
        return target.emit("mssp", event.mssp);
      }
      default:
        return false;
    }
  }

  /** Emit a "mssp" event with a mssp event object. */
  public emit(event: "mssp", data: IMSSPEvent): boolean;
  /** Emit a "environ" event with a environ event object. */
  public emit(event: "environ", data: IEnvironEvent): boolean;
  /** Emit a "compress" event with a compress event object. */
  public emit(event: "compress", data: ICompressEvent): boolean;
  /** Emit a "ttype" event with a ttype event object. */
  public emit(event: "ttype", data: ITType): boolean;
  /** Emit a "zmp" event with a zmp event object. */
  public emit(event: "zmp", data: IZMPEvent): boolean;
  /** Emit a "sb" event with a sb event object. */
  public emit(event: "sb", data: ISubnegotiationEvent): boolean;
  /** Emit a "error" event with a error event object. */
  public emit(event: "error", data: IErrorEvent): boolean;
  /** Emit a "send" event with a data event object. */
  public emit(event: "send", data: IDataEvent): boolean;
  /** Emit a "data" event with a data event object. */
  public emit(event: "data", data: IDataEvent): boolean;
  /** Emit a "iac" event with a iac event object. */
  public emit(event: "iac", data: IIACEvent): boolean;
  /** Emit a "negotiate" event with a negotiate event object. */
  public emit(event: "negotiate", data: INegotiationEvent): boolean;
  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /** Listen for an mssp event. The callback accepts a mssp event object. */
  public on(event: "mssp", listener: (data: IMSSPEvent) => void): this;
  /** Listen for an environ event. The callback accepts a environ event object. */
  public on(event: "environ", listener: (data: IEnvironEvent) => void): this;
  /** Listen for an compress event. The callback accepts a compress event object. */
  public on(event: "compress", listener: (data: ICompressEvent) => void): this;
  /** Listen for an ttype event. The callback accepts a ttype event object. */
  public on(event: "ttype", listener: (data: ITType) => void): this;
  /** Listen for an zmp event. The callback accepts a zmp event object. */
  public on(event: "zmp", listener: (data: IZMPEvent) => void): this;
  /** Listen for an sb event. The callback accepts a sb event object. */
  public on(event: "sb", listener: (data: ISubnegotiationEvent) => void): this;
  /** Listen for an error event. The callback accepts a error event object. */
  public on(event: "error", listener: (data: IErrorEvent) => void): this;
  /** Listen for a send event. The callback accepts a data event object with a payload. This payload must be written to the socket immediately, because the data will be freed by the runtime after the event fires. */
  public on(event: "send", listener: (data: IDataEvent) => void): this;
  /** Listen for a data event. The callback accepts a data event object. This payload must be treated as a telnet message or copied immediately, because the data will be freed by the runtime after the event fires. */
  public on(event: "data", listener: (data: IDataEvent) => void): this;
  /** Listen for an iac event. The callback accepts a iac event object. */
  public on(event: "iac", listener: (data: IIACEvent) => void): this;
  /** Listen for a DO, DONT, WILL or WONT event. The callback accepts a NegotiationEvent object. */
  public on(
    event: "negotiate",
    listener: (data: INegotiationEvent) => void,
  ): this;
  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /** Create a TelnetEvent from a given pointer. */
  public static getEvent(pointer: number): TelnetEvent {
    return new TelnetEvent(pointer, new DataView(telnet.HEAPU8.buffer));
  }

  /** This is an internal pointer to the heap where the telnet object is contained in c. */
  private pointer: number;

  constructor(compatibilityTable: CompatiblityTable, flags: TelnetFlag) {
    super();

    // TODO: make the CompatibilityTable interface more user friendly.

    // collect a reference to the heap and how long the table needs to be
    const heap = new DataView(telnet.HEAPU8.buffer);
    const length = compatibilityTable.length;

    // Create a set of telnet_telopt_t references ending with an additional [-1, 0, 0]

    // telnet_telopt_t shape (4 bytes)
    // short telopt
    // unsigned char us
    // unsigned char him

    // the array size must contain (length + 1) * u32_size bytes
    const arraySize = (length + 1) << 2;
    // allocate the array
    const arrayPointer = telnet._malloc(arraySize);
    if (arrayPointer === 0) throw new Error("Out of memory.");

    // add the array to the auto-free pointers when this telnet is destroyed
    this._toFree.push(arrayPointer);

    // for each entry in the compatibility table
    for (let i = 0; i < length; i++) {
      const entry = compatibilityTable[i];

      // allocate 4 bytes, [i16, u8, u8]
      const entryPointer = telnet._malloc(4);
      if (entryPointer === 0) throw new Error("Out of memory.");

      // set the telopt option value
      heap.setInt16(
        entryPointer + consts.telnet_telopt_t_telopt_offset,
        entry[0],
        true,
      );

      // should be set to WILL/WONT
      const us = entry[1] ? TelnetCommand.WILL : TelnetCommand.WONT;
      heap.setUint8(entryPointer + consts.telnet_telopt_t_us_offset, us);

      // should be set to DO/DONT
      const him = entry[2] ? TelnetCommand.DO : TelnetCommand.DONT;
      heap.setUint8(entryPointer + consts.telnet_telopt_t_him_offset, him);

      // each entry should be freed at some point
      this._toFree.push(entryPointer);

      // set the table entry at the next index
      heap.setUint32(arrayPointer + (i << 2), entryPointer, true);
    }

    // create the last entry [-1, 0, 0]
    const finalEntryPointer = telnet._malloc(4);
    if (finalEntryPointer === 0) throw new Error("Out of memory.");
    heap.setUint32(finalEntryPointer, 0, true); // clear the memory in case
    heap.setInt16(finalEntryPointer + consts.telnet_telopt_t_telopt_offset, -1);
    this._toFree.push(finalEntryPointer);

    // set the last entry in the table
    heap.setUint32(arrayPointer + (length << 2), finalEntryPointer, true);

    // finally pass the array pointer into the telnet_init function
    this.pointer = telnet._telnet_init(arrayPointer, flags, 0); // user data is null

    // hook up event listener
    Telnet.map.set(this.pointer, this);
  }

  /**
   * Whenever a socket receives a message, call this method with the array of bytes
   * that were received.
   *
   * @param {ArrayLike<number>} bytes - An arraylike reference that contains byte values.
   */
  receive(bytes: ArrayLike<number>): void {
    const bufferLength = bytes.length;
    const bufferPointer = telnet._malloc(bufferLength + 1);
    if (bufferPointer === 0) throw new Error("Out of memory.");
    telnet.HEAPU8.set(bytes, bufferPointer);
    telnet.HEAPU8[bufferPointer + bufferLength] = 0;
    telnet._telnet_recv(this.pointer, bufferPointer, bufferLength);
    telnet._free(bufferPointer);
  }

  /**
   * Whenever an IAC event must be emitted, this method will automatically generate a SEND event.
   *
   * Format: [IAC, CMD]
   * @param {TelnetCommand} cmd - The TelnetCommand to be sent.
   */
  iac(cmd: TelnetCommand): void {
    telnet._telnet_iac(this.pointer, cmd);
  }

  /**
   * Send a WILL, WONT, DO or DONT negotiation for a given option. This automatically generates a SEND event.
   *
   * @param {TelnetNegotiationCommand} cmd - DO, DONT, WILL, or WONT
   * @param {TelnetOption} option - The telnet option.
   */
  negotiate(cmd: TelnetNegotiationCommand, option: TelnetOption): void {
    telnet._telnet_negotiate(this.pointer, cmd, option);
  }

  /**
   * Send raw bytes through telnet so that the bytes are encoded properly.
   *
   * @param {ArrayLike<number>} buffer - The data to be sent.
   */
  send(buffer: ArrayLike<number>): void {
    const length = buffer.length;
    const ptr = telnet._malloc(length);
    telnet.HEAPU8.set(buffer, ptr);
    telnet._telnet_send(this.pointer, ptr, length);
  }

  /**
   * Send a string encoded to ASCII through telnet.
   *
   * @param {string} str - The string to be sent.
   */
  sendText(str: string): void {
    let length = str.length + 1; // add 1 for null termination
    let ptr = telnet._malloc(length);
    telnet.writeAsciiToMemory(ptr, str, false);
    telnet._telnet_send_text(this.pointer, ptr, length - 1);
    telnet._free(ptr);
  }

  /**
   * Send a subnegotiation event through telnet.
   *
   * @param {TelnetOption} telopt - The telnet option for subnegotiation.
   * @param {ArrayLike<number>} data - The data to be encoded.
   */
  subnegotiation(telopt: TelnetOption, data: ArrayLike<number>): void {
    const length = data.length;
    const pointer = telnet._malloc(length);
    telnet.HEAPU8.set(data, pointer);
    telnet._telnet_subnegotiation(this.pointer, telopt, pointer, length);
    telnet._free(pointer);
  }

  /** Call this method when the connection is disposed or you will have memory leaks. */
  dispose(): void {
    this._toFree.forEach((ptr) => telnet._free(ptr));
    telnet._telnet_free(this.pointer);
    Telnet.map.delete(this.pointer);
  }
}
