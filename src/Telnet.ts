const telnet = require("../build/libtelnet");

export class Telnet {
  private pointer = telnet.telnet_init(0, 0, 0, 0);

  constructor() {
    console.log(this.pointer);
  }
}
