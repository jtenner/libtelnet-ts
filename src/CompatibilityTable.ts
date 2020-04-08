import { TelnetOption } from "./consts";
import { TelnetAPI } from "./TelnetAPI";

const telnet = require("../build/libtelnet") as TelnetAPI;

/** This class represents a table of supported telnet options. */
export class CompatibilityTable {
  public pointer: number = 0;

  /** Shorthand for new CompatibilityTableGenerator() */
  public static create(): CompatibilityTable {
    return new CompatibilityTable();
  }

  private table: [TelnetOption, boolean, boolean][] = [];

  /** Add a supported option, and wether it's supported locally and/or remotely. */
  public support(option: TelnetOption, local: boolean, remote: boolean): this {
    this.table.push([option, local, remote]);
    return this;
  }

  /** Finally generate the table. This will commit the table to memory and can be reused. */
  public finish(): CompatibilityTable {
    if (this.pointer !== 0) return this;

    // collect a reference to the heap and how long the table needs to be
    const heap = telnet.HEAPU8;
    const table = this.table;
    const length = table.length;

    // allocate the array
    const arrayPointer = telnet._malloc(256);
    if (arrayPointer === 0) throw new Error("Out of memory.");

    // zero the memory
    heap.fill(0, arrayPointer, arrayPointer + 256);

    // for each entry in the compatibility table
    for (let i = 0; i < length; i++) {
      const entry = table[i];
      const entryPointer = arrayPointer + entry[0];

      // set the telopt option value
      // support local | remote
      heap[entryPointer] = (entry[1] ? 0b10 : 0) | (entry[2] ? 0b01 : 0);
    }

    this.pointer = arrayPointer;
    return this;
  }

  /** Dispose this table when it is no longer needed or used. */
  public dispose() {
    telnet._free(this.pointer);
  }
}
