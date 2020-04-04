import {
  TelnetEvent,
  TelnetEventType,
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

const telnet = require("../build/libtelnet");

telnet.onRuntimeInitialized = function () {
  telnet._init();
  console.log(telnet);
};

export class Telnet extends EventEmitter {
  private static map = new Map<number, Telnet>();

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

  constructor() {
    super();
    this.pointer = telnet.telnet_init(0, 0, 0);
    console.log(this.pointer);
  }
}
