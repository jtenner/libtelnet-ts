import { TelnetOption } from "./consts";
/** This class represents a table of supported telnet options. */
export declare class CompatibilityTable {
    pointer: number;
    /** Shorthand for new CompatibilityTableGenerator() */
    static create(): CompatibilityTable;
    private table;
    /** Add a supported option, and wether it's supported locally and/or remotely. */
    support(option: TelnetOption, local: boolean, remote: boolean): this;
    /** Finally generate the table. This will commit the table to memory and can be reused. */
    finish(): CompatibilityTable;
    /** Dispose this table when it is no longer needed or used. */
    dispose(): void;
}
//# sourceMappingURL=CompatibilityTable.d.ts.map