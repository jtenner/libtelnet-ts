import { TelnetAPI } from "./TelnetAPI";

export function AsciiToString(telnet: TelnetAPI, ptr: number): string | null {
  if (ptr === 0) return null;
  const decoder = new TextDecoder();
  const heap = getHeapU8(telnet) as Uint8Array;
  const end = heap.indexOf(0, ptr);
  return decoder.decode(heap.subarray(ptr, end));
}

export function writeAsciiToMemory(telnet: TelnetAPI, str: string): number {
  const encoder = new TextEncoder();
  const binary = encoder.encode(str);
  const pointer = telnet.malloc(binary.byteLength + 1);
  // in case the memory increases
  const heap = getHeapU8(telnet);
  heap.set(binary, pointer);
  heap[pointer + binary.byteLength] = 0; // null terminated
  return pointer;
}

export function getHeapU8(telnet: TelnetAPI): Uint8Array {
  return new Uint8Array(telnet.memory.buffer);
}

export function getDataView(telnet: TelnetAPI): DataView {
  return new DataView(telnet.memory.buffer);
}
