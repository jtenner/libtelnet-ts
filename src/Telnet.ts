import { TelnetEvent } from "./TelnetEvent";

const telnet = require("../build/libtelnet");

telnet.onRuntimeInitialized = function() {
  telnet._init();
  console.log(Telnet);
}
export class Telnet {
  private static map = new Map<number, Telnet>();

  public static route(telnet: number, _eventPointer: number, _userDataPointer: number): void {
    let target = Telnet.map.get(telnet);
    if (!target) throw new Error("Invalid event target.");
  }

  public static getEvent(pointer: number): TelnetEvent {
    return new TelnetEvent(pointer, telnet.HEAPU8);
  }

  private pointer: number;

  constructor() {
    this.pointer = telnet.telnet_init(0, 0, 0);
    console.log(this.pointer);
  }
}

