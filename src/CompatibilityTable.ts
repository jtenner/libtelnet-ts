import { TelnetOption } from "./consts";
import { TelnetAPI } from "./TelnetAPI";

const telnet = require("../build/libtelnet") as TelnetAPI;

/** This class represents a table of supported telnet options. */
export class CompatibilityTable {
  public pointer: number = 0;
  protected table = new Uint8Array(256);

  /** Shorthand for new CompatibilityTableGenerator() */
  public static create(): CompatibilityTable {
    return new CompatibilityTable();
  }

  /** Add a supported option, and wether it's supported locally and/or remotely. */
  public support(option: TelnetOption, local: boolean, remote: boolean): this {
    this.table[option] = (local ? 0b10 : 0) | (remote ? 0b01 : 0);
    return this;
  }

  /** Finally generate the table. This will commit the table to memory and can be reused. */
  public finish(): CompatibilityTable {
    if (this.pointer !== 0) return this;

    // allocate the array
    const arrayPointer = telnet._malloc(256);
    if (arrayPointer === 0) throw new Error("Out of memory.");

    // set the memory at the pointer
    telnet.HEAPU8.set(this.table, arrayPointer);

    this.pointer = arrayPointer;
    return this;
  }

  /** Dispose this table when it is no longer needed or used. */
  public dispose() {
    telnet._free(this.pointer);
  }
}
