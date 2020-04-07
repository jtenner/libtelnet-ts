/// <reference types="node" />
import { TelnetEvent, INegotiationEvent, IIACEvent, IDataEvent, IErrorEvent, ISubnegotiationEvent, IZMPEvent, ITType, ICompressEvent, IEnvironEvent, IMSSPEvent } from "./TelnetEvent";
import { EventEmitter } from "events";
import { TelnetFlag, TelnetOption, TelnetCommand, TelnetNegotiationCommand } from "./consts";
import { CompatibilityTable } from "./CompatibilityTable";
/**
 * A state machine that implements the telnet specification and calls out into
 * web assembly to encode and decode messages from a socket.
 */
export declare class Telnet extends EventEmitter {
    /**
     * When the runtime is finally initialized, this promise will resolve,
     * and telnet objects can finally be instantiated.
     */
    static ready: Promise<unknown>;
    /** A map of pointers to their respective Telnet objects for event routing. */
    private static map;
    /** A collection of pointers to be freed when this Telnet object is disposed. */
    private _toFree;
    /** A routing function that gets called from web assembly when a Telnet object must fire an event. */
    static route(telnet: number, eventPointer: number): boolean;
    /** Emit a "mssp" event with a mssp event object. */
    emit(event: "mssp", data: IMSSPEvent): boolean;
    /** Emit a "environ" event with a environ event object. */
    emit(event: "environ", data: IEnvironEvent): boolean;
    /** Emit a "compress" event with a compress event object. */
    emit(event: "compress", data: ICompressEvent): boolean;
    /** Emit a "ttype" event with a ttype event object. */
    emit(event: "ttype", data: ITType): boolean;
    /** Emit a "zmp" event with a zmp event object. */
    emit(event: "zmp", data: IZMPEvent): boolean;
    /** Emit a "sb" event with a sb event object. */
    emit(event: "sb", data: ISubnegotiationEvent): boolean;
    /** Emit a "error" event with a error event object. */
    emit(event: "error", data: IErrorEvent): boolean;
    /** Emit a "send" event with a data event object. */
    emit(event: "send", data: IDataEvent): boolean;
    /** Emit a "data" event with a data event object. */
    emit(event: "data", data: IDataEvent): boolean;
    /** Emit a "iac" event with a iac event object. */
    emit(event: "iac", data: IIACEvent): boolean;
    /** Emit a "negotiate" event with a negotiate event object. */
    emit(event: "negotiate", data: INegotiationEvent): boolean;
    /** Listen for an mssp event. The callback accepts a mssp event object. */
    on(event: "mssp", listener: (data: IMSSPEvent) => void): this;
    /** Listen for an environ event. The callback accepts a environ event object. */
    on(event: "environ", listener: (data: IEnvironEvent) => void): this;
    /** Listen for an compress event. The callback accepts a compress event object. */
    on(event: "compress", listener: (data: ICompressEvent) => void): this;
    /** Listen for an ttype event. The callback accepts a ttype event object. */
    on(event: "ttype", listener: (data: ITType) => void): this;
    /** Listen for an zmp event. The callback accepts a zmp event object. */
    on(event: "zmp", listener: (data: IZMPEvent) => void): this;
    /** Listen for an sb event. The callback accepts a sb event object. */
    on(event: "sb", listener: (data: ISubnegotiationEvent) => void): this;
    /** Listen for an error event. The callback accepts a error event object. */
    on(event: "error", listener: (data: IErrorEvent) => void): this;
    /** Listen for a send event. The callback accepts a data event object with a payload. This payload must be written to the socket immediately, because the data will be freed by the runtime after the event fires. */
    on(event: "send", listener: (data: IDataEvent) => void): this;
    /** Listen for a data event. The callback accepts a data event object. This payload must be treated as a telnet message or copied immediately, because the data will be freed by the runtime after the event fires. */
    on(event: "data", listener: (data: IDataEvent) => void): this;
    /** Listen for an iac event. The callback accepts a iac event object. */
    on(event: "iac", listener: (data: IIACEvent) => void): this;
    /** Listen for a DO, DONT, WILL or WONT event. The callback accepts a NegotiationEvent object. */
    on(event: "negotiate", listener: (data: INegotiationEvent) => void): this;
    /** Create a TelnetEvent from a given pointer. */
    static getEvent(pointer: number): TelnetEvent;
    /** This is an internal pointer to the heap where the telnet object is contained in c. */
    private pointer;
    constructor(compatibilityTable: CompatibilityTable, flags: TelnetFlag);
    /**
     * Whenever a socket receives a message, call this method with the array of bytes
     * that were received.
     *
     * @param {ArrayLike<number>} bytes - An arraylike reference that contains byte values.
     */
    receive(bytes: ArrayLike<number>): void;
    /**
     * Whenever an IAC event must be emitted, this method will automatically generate a SEND event.
     *
     * Format: [IAC, CMD]
     * @param {TelnetCommand} cmd - The TelnetCommand to be sent.
     */
    iac(cmd: TelnetCommand): void;
    /**
     * Send a WILL, WONT, DO or DONT negotiation for a given option. This automatically generates a SEND event.
     *
     * @param {TelnetNegotiationCommand} cmd - DO, DONT, WILL, or WONT
     * @param {TelnetOption} option - The telnet option.
     */
    negotiate(cmd: TelnetNegotiationCommand, option: TelnetOption): void;
    /**
     * Send raw bytes through telnet so that the bytes are encoded properly.
     *
     * @param {ArrayLike<number>} buffer - The data to be sent.
     */
    send(buffer: ArrayLike<number>): void;
    /**
     * Send a string encoded to ASCII through telnet.
     *
     * @param {string} str - The string to be sent.
     */
    sendText(str: string): void;
    /**
     * Send a subnegotiation event through telnet.
     *
     * @param {TelnetOption} telopt - The telnet option for subnegotiation.
     * @param {ArrayLike<number>} data - The data to be encoded.
     */
    subnegotiation(telopt: TelnetOption, data: ArrayLike<number>): void;
    /** Call this method when the connection is disposed or you will have memory leaks. */
    dispose(): void;
}
//# sourceMappingURL=Telnet.d.ts.map