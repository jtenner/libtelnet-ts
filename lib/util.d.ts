import { TelnetAPI } from "./TelnetAPI";
export declare function AsciiToString(telnet: TelnetAPI, ptr: number): string | null;
export declare function writeAsciiToMemory(telnet: TelnetAPI, str: string): number;
export declare function getHeapU8(telnet: TelnetAPI): Uint8Array;
export declare function getDataView(telnet: TelnetAPI): DataView;
//# sourceMappingURL=util.d.ts.map