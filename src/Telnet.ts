import {
  TelnetEvent,
  INegotiation,
  IIAC,
  IData,
  IError,
  ISubnegotiation,
  IZMP,
  ITType,
  ICompress,
  IEnviron,
  IMSSP,
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

telnet.onRuntimeInitialized = function () {
  telnet._init();
  console.log(telnet);
};

export type CompatiblityTable = [TelnetOption, boolean, boolean][];

export class Telnet extends EventEmitter {
  private static map = new Map<number, Telnet>();

  private _toFree: number[] = [];

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
      case TelnetEventType.DATA:
      case TelnetEventType.SEND: {
        return target.emit("data", event.data);
      }
      case TelnetEventType.WARNING:
      case TelnetEventType.ERROR: {
        return target.emit("error", event.error);
      }
      case TelnetEventType.SUBNEGOTIATION: {
        return target.emit("sb", event.subnegotiate);
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

  public emit(event: "mssp", data: IMSSP): boolean;
  public emit(event: "environ", data: IEnviron): boolean;
  public emit(event: "compress", data: ICompress): boolean;
  public emit(event: "ttype", data: ITType): boolean;
  public emit(event: "zmp", data: IZMP): boolean;
  public emit(event: "sb", data: ISubnegotiation): boolean;
  public emit(event: "error", data: IError): boolean;
  public emit(event: "data", data: IData): boolean;
  public emit(event: "iac", data: IIAC): boolean;
  public emit(event: "negotiate", data: INegotiation): boolean;
  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  public on(event: "mssp", listener: (data: IMSSP) => void): this;
  public on(event: "environ", listener: (data: IEnviron) => void): this;
  public on(event: "compress", listener: (data: ICompress) => void): this;
  public on(event: "ttype", listener: (data: ITType) => void): this;
  public on(event: "zmp", listener: (data: IZMP) => void): this;
  public on(event: "sb", listener: (data: ISubnegotiation) => void): this;
  public on(event: "error", listener: (data: IError) => void): this;
  public on(event: "data", listener: (data: IData) => void): this;
  public on(event: "iac", listener: (data: IIAC) => void): this;
  public on(event: "negotiate", listener: (data: INegotiation) => void): this;
  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  public static getEvent(pointer: number): TelnetEvent {
    return new TelnetEvent(pointer, new DataView(telnet.HEAPU8.buffer));
  }

  private pointer: number;

  constructor(compatibilityTable: CompatiblityTable, flags: TelnetFlag) {
    super();
    const heap = new DataView(telnet.HEAPU8.buffer);
    const length = compatibilityTable.length;

    // Need to set the telopt array

    // telnet_telopt_t shape (4 bytes)
    // short telopt
    // unsigned char us
    // unsigned char him
    const arraySize = (length + 1) << 2;
    const arrayPointer = telnet._malloc(arraySize);
    if (arrayPointer === 0) throw new Error("Out of memory.");
    this._toFree.push(arrayPointer);

    for (let i = 0; i < length; i++) {
      const entry = compatibilityTable[i];
      const entryPointer = telnet._malloc(4);
      if (entryPointer === 0) throw new Error("Out of memory.");

      heap.setInt16(
        entryPointer + consts.telnet_telopt_t_telopt_offset,
        entry[0],
        true,
      );
      const us = entry[1] ? TelnetCommand.WILL : TelnetCommand.WONT;
      const him = entry[2] ? TelnetCommand.DO : TelnetCommand.DONT;
      heap.setUint8(entryPointer + consts.telnet_telopt_t_us_offset, us);
      heap.setUint8(entryPointer + consts.telnet_telopt_t_him_offset, him);
      this._toFree.push(entryPointer);

      // set the table entry
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
  }

  receive(bytes: Uint8Array | Buffer | number[]): void {
    const bufferLength = bytes.length;
    const bufferPointer = telnet._malloc(bufferLength);
    if (bufferPointer === 0) throw new Error("Out of memory.");
    telnet.HEAPU8.set(bytes, bufferPointer);
    telnet._telnet_recv(this.pointer, bufferPointer, bufferLength);
    telnet._free(bufferPointer);
  }

  iac(cmd: TelnetCommand): void {
    telnet._telnet_iac(this.pointer, cmd);
  }

  negotiate(cmd: TelnetNegotiationCommand, option: TelnetOption): void {
    telnet._telnet_negotiate(this.pointer, cmd, option);
  }

  send(buffer: Uint8Array | Buffer | number[]): void {
    const length = buffer.length;
    const ptr = telnet._malloc(length);
    telnet.HEAPU8.set(buffer, ptr);
    telnet._telnet_send(this.pointer, ptr, length);
  }

  sendText(str: string): void {
    let length = str.length + 1; // add 1 for null termination
    let ptr = telnet._malloc(length);
    telnet.writeAsciiToMemory(ptr, str, false);
    telnet._telnet_send_text(this.pointer, ptr, length - 1);
    telnet._free(ptr);
  }

  dispose(): void {
    this._toFree.forEach((ptr) => telnet._free(ptr));
    telnet._telnet_free(this.pointer);
  }
}
