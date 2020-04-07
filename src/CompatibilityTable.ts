import {
  TelnetOption,
  TelnetNegotiationCommand,
  TelnetCommand,
  consts,
} from "./consts";
import { TelnetAPI } from "./TelnetAPI";

const telnet = require("../build/libtelnet") as TelnetAPI;

/** This class represents a table of supported telnet options. */
export class CompatibilityTable {
  public pointer: number = 0;

  /** Shorthand for new CompatibilityTableGenerator() */
  public static create(): CompatibilityTable {
    return new CompatibilityTable();
  }

  private table: [
    TelnetOption,
    TelnetNegotiationCommand,
    TelnetNegotiationCommand,
  ][] = [];

  /** Add a supported option, and wether it's supported locally and/or remotely. */
  public support(option: TelnetOption, local: boolean, remote: boolean): this {
    this.table.push([
      option,
      local ? TelnetCommand.WILL : TelnetCommand.WONT,
      remote ? TelnetCommand.DO : TelnetCommand.DONT,
    ]);
    return this;
  }

  /** Finally generate the table. This will commit the table to memory and can be reused. */
  public finish(): CompatibilityTable {
    if (this.pointer !== 0) return this;

    // collect a reference to the heap and how long the table needs to be
    const heap = new DataView(telnet.HEAPU8.buffer);
    const table = this.table;
    const length = table.length;

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

    // for each entry in the compatibility table
    for (let i = 0; i < length; i++) {
      const entry = table[i];

      // allocate 4 bytes, [i16, u8, u8]
      const entryPointer = arrayPointer + (i << consts.U32_ALIGN);
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
    }

    // create the last entry [-1, 0, 0]
    const finalEntryPointer = telnet._malloc(4);
    if (finalEntryPointer === 0) throw new Error("Out of memory.");
    heap.setUint32(finalEntryPointer, 0, true); // clear the memory in case
    heap.setInt16(finalEntryPointer + consts.telnet_telopt_t_telopt_offset, -1);

    // set the last entry in the table
    heap.setUint32(arrayPointer + (length << 2), finalEntryPointer, true);

    this.pointer = arrayPointer;
    return this;
  }

  /** Dispose this table when it is no longer needed or used. */
  public dispose() {
    telnet._free(this.pointer);
  }
}
