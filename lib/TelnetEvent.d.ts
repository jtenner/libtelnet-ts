import { DataEventType, TelnetErrorCode, TelnetEventType, TelnetOption, NegotiationEventType, EnvironCommand, ErrorEventType, TelnetCommand } from "./consts";
/** A data event. Can be incoming as `TelnetEventType.DATA` or outgoing `TelnetEventType.SEND`. */
export interface IDataEvent {
    readonly type: DataEventType;
    readonly buffer: Uint8Array;
    readonly size: number;
}
/** An error event, can be a `TelnetEventType.WARNING` or an `TelnetEventType.ERROR`. */
export interface IErrorEvent {
    readonly type: ErrorEventType;
    readonly file: string | null;
    readonly func: string | null;
    readonly msg: string | null;
    readonly line: number;
    readonly errcode: TelnetErrorCode;
}
/** An IAC event with the given command. */
export interface IIACEvent {
    readonly type: TelnetEventType.IAC;
    readonly cmd: TelnetCommand;
}
/** A telnet negotation event of type DO, DONT, WILL, or WONT. */
export interface INegotiationEvent {
    readonly type: NegotiationEventType;
    readonly telopt: TelnetOption;
}
/** A subnegotiation with an option and a payload. */
export interface ISubnegotiationEvent {
    readonly type: TelnetEventType.SUBNEGOTIATION;
    readonly buffer: Uint8Array;
    readonly size: number;
    readonly telopt: TelnetOption;
}
/** ZMP event. */
export interface IZMPEvent {
    readonly type: TelnetEventType.ZMP;
    readonly argv: Array<string | null>;
    readonly argc: number;
}
/** A compression event. */
export interface ICompressEvent {
    readonly type: TelnetEventType.COMPRESS;
    readonly state: boolean;
}
/** An environ event, with a set of IEnvironVar values and an Environ Command. */
export interface IEnvironEvent {
    readonly type: TelnetEventType.ENVIRON;
    readonly values: IEnvironVar[];
    readonly size: number;
    readonly cmd: EnvironCommand;
}
/** An MSSPEvent. */
export interface IMSSPEvent {
    readonly type: TelnetEventType.MSSP;
    readonly values: IEnvironVar[];
    readonly size: number;
}
/** The environ var types. */
export declare enum EnvironVarType {
    VAR = 0,
    VALUE = 1,
    ESC = 2,
    USERVAR = 3
}
/** An Environ var. */
export interface IEnvironVar {
    readonly type: EnvironVarType;
    readonly var: string | null;
    readonly value: string | null;
}
/** TType Command. */
export declare enum TTypeCommand {
    IS = 0,
    SEND = 1
}
/** A TType event. */
export interface ITType {
    readonly type: TelnetEventType.TTYPE;
    readonly cmd: TTypeCommand;
    readonly name: string;
}
/**
 * A basis for all telnet events. Internal use only. It uses the internal
 * properties to "Cast" the event to the appropriate type.
 */
export declare class TelnetEvent {
    pointer: number;
    private heap;
    /** The telnet event type. */
    type: TelnetEventType;
    constructor(pointer: number, heap: DataView);
    /**
     * Interpret this event as a data event. Either TelnetEventType.{Data | Send}.
     *
     * struct data_t {
     *   enum telnet_event_type_t _type; -> EventType
     *   const char *buffer; -> string
     *   size_t size; -> number
     * } data;
     */
    get data(): IDataEvent;
    /**
     * Interpret this event as an error.
     *
     * struct error_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   const char *file; -> string
     *   const char *func; -> string
     *   const char *msg; -> string
     *   int line; -> number
     *   telnet_error_t errcode; -> TelnetErrorCode
     * } error;
     */
    get error(): IErrorEvent;
    /**
     * Interpret this event as an IAC (Interpret as Command)
     *
     * struct iac_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   unsigned char cmd; -> TelnetOption
     * } iac;
     */
    get iac(): IIACEvent;
    /**
     * Interpret this event as a Negotiation event. I.E. DO, DONT, WILL, WONT
     *
     * struct negotiate_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   unsigned char telopt; -> TelnetOption
     * } neg;
     */
    get negotiate(): INegotiationEvent;
    /**
     * Interpret this event as a subnegotiation.
     *
     * struct subnegotiation_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   const char *buffer; -> Uint8Array
     *   size_t size; -> number
     *   unsigned char telopt; -> TelnetOption
     * } sub;
     */
    get sub(): ISubnegotiationEvent;
    /**
     * Interpret this event as a ZMP event.
     *
     * struct zmp_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   const char **argv; -> string[]
     *   size_t argc; -> number
     * } zmp;
     */
    get zmp(): IZMPEvent;
    /**
     * Interpret this event as a TType event.
     *
     * struct ttype_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   unsigned char cmd; -> TTypeCommand
     *   const char* name; -> string
     * } ttype;
     */
    get ttype(): ITType;
    /**
     * Interpet this event as a Compress event.
     *
     * struct compress_T {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   unsigned char state; -> boolean
     * } compress;
     */
    get compress(): ICompressEvent;
    /**
     * Interpret this event as an Environ event.
     *
     * struct environ_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   const struct telnet_environ_t *values; -> IEnvironVar[]
     *   size_t size; -> number
     *   unsigned char cmd; -> EnvironCommand
     * } environ;
     */
    get environ(): IEnvironEvent;
    /**
     * Interpret this event as a MSSP event.
     *
     * struct mssp_t {
     *   enum telnet_event_type_t _type; -> TelnetEventType
     *   const struct telnet_environ_t *values; -> IEnvironVar[]
     *   size_t size; -> number
     * } mssp;
     */
    get mssp(): IMSSPEvent;
}
//# sourceMappingURL=TelnetEvent.d.ts.map