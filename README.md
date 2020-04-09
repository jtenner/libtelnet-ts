[![Actions Status](https://github.com/jtenner/libtelnet-ts/workflows/CI/badge.svg)](https://github.com/jtenner/libtelnet-ts/actions)

# libtelnet - TELNET protocol handling library

See the original `c` implementation here: http://github.com/seanmiddleditch/libtelnet

Sean Middleditch and contributors

The author or authors of this code dedicate any and all copyright
interest in this code to the public domain. We make this dedication
for the benefit of the public at large and to the detriment of our
heirs and successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
code under copyright law.

## I. Introduction

libtelnet provides safe and correct handling of the core TELNET
protocol. In addition to the base TELNET protocol, libtelnet also
implements the Q method of TELNET option negotiation. libtelnet can
be used for writing servers, clients, or proxies.

For more information on the TELNET standards supported by libtelnet,
visit the following websites:

- http://www.faqs.org/rfcs/rfc854.html
- http://www.faqs.org/rfcs/rfc855.html
- http://www.faqs.org/rfcs/rfc1091.html
- http://www.faqs.org/rfcs/rfc1143.html
- http://www.faqs.org/rfcs/rfc1408.html
- http://www.faqs.org/rfcs/rfc1572.html

## II. TS API

The TS api is a simple wrapper for the libtelnet package.

### II.a TS Example Echo Server

```ts
import { Telnet, CompatibilityTable, TelnetOption } from "libtelnet-ts";

import net from "net";

const server = net.createServer();

let table;

server.on("connection", (socket) => {
  const telnet = new Telnet(table);

  // all bytes must immediately pass through telnet as a Buffer or Uint8Array
  socket.on("data", (bytes) => {
    telnet.receive(bytes);
  });

  // any bytes that should be sent to the client must pass through the telnet protocol
  telnet.on("send", (event) => {
    socket.write(event.buffer);
  });

  // sanitized data and properly escaped from telnet
  telnet.on("data", (event) => {
    // inspect the incoming bytes by writing them to stdout
    process.stdout.write(event.buffer);

    // this data should be sent back to the client, send the bytes through telnet
    telnet.send(event.buffer);
  });

  // always call telnet.dispose() when a socket closees
  socket.on("close", () => {
    telnet.dispose();
  });
});

Telnet.ready.then((e) => {
  // must wait for the runtime to initialize the table
  table = CompatibilityTable.create()
    .support(TelnetOption.ECHO, true, false) // local and remote echo
    .finish();
  server.listen(1234);
});
```

### II.b Notes Regarding Usage

The libtelnet-ts API contains several distinct parts. The
first part is the constructor and dispose methods. The
second part is methods for pushing to the telnet processor.
The third part is the output functions, which generate
TELNET commands and ensure data is properly formatted before
sending over the wire. The final part is the event handler
interface.

This document covers only the most basic functions. See the
libtelnet manual pages or HTML documentation for a complete
reference.

#### IIIa. Initialization

Using libtelnet requires the initialization of a `Telnet` class
which references a `telnet_t` struct inside Web Assembly for all
current option states for a single TELNET connection.

Initializing a `Telnet` object requires several pieces of data.
One of these is a `CompatibilityTable` support reference, which
specifies which TELNET options your application supports both
locally and remotely. This table is comprised of entries, one for
each supported option. Each entry specifies the option supported,
whether the option is supported locally or remotely.

```ts
import { Telnet, CompatibilityTable, TelnetOption } from "libtelnet-ts";

let table;

Telnet.ready.then((e) => {
  // choose whatever options you want to support here
  table = CompatiblityTable.create()
    .supprt(TelnetOption.BINARY, localSupport, remoteSupport)
    // write the table into web assembly
    .finish();
});
```

The `local` parameter denotes whether your application supports
the option locally. It should be set to `true` if you support it
and to `false` if you don't. The remote field denotes whether the
option is supported on the remote end, and should be `true` if yes
and `false` if not.

You must always call `finish()` or the table will not be used.

If you need to dynamically alter supported options on a
per-connection basis then you may use a different table
(dynamically allocated if necessary) per call to `new Telnet()` or
you share a single constant table like the above example between
all connections if you support a fixed set of options. Most
applications will support only a fixed set of options. Please note
that you must deallocate each created table when the connection is
disposed by calling `compatibliityTable.dispose()` or you will have
a very large memory leak in your application.

- `new Telnet(table, flags);`

  The `Telnet` constructor is responsible for allocating memory
  and initializing the data in a telnet_t structure inside web
  assembly. It must be called immediately after establishing a
  connection.

  The `table` field is a `CompatibilityTable` reference as
  described above.

  The flags parameter can be any of the following flag constants
  bit-or'd together, or 0 to leave all options disabled.

  `TelnetFlag.PROXY`
  Operate in proxy mode. This disables the RFC1143 support and
  enables automatic detection of COMPRESS2 streams.

  `TelnetFlag.NVT_EOL`
  Receive data with translation of the TELNET NVT CR NUL and CR LF
  sequences specified in RFC854 to C carriage return (\r) and C
  newline (\n), respectively.

  If the `Telnet` constructor fails to allocate the required memory,
  the returned pointer will be zero, and throw a runtime error.

- `telnet.dispose()`

  Releases any internal memory allocated by libtelnet-ts for the given
  `Telnet` object. This must be called whenever a connection is
  closed, or you will incur memory leaks. The pointer passed in may
  no longer be used afterwards.

#### IIIb. Receiving Data

- `telnet.receive(bytes: ArrayLike<number>): void`

  When your application receives data over the socket from the
  remote end, it must pass the received bytes into this function.

  As the TELNET stream is parsed, events will be generated and sent
  out of the `Telnet` event emitter methods. Of particular interest
  for data receiving is the `Telnet.on("data", callback)` event,
  which is triggered for any regular data such as user input or
  server process output.

  Example:

```ts
socket.on("data", (buffer) => {
  telnet.receive(buffer); // pass it to telnet immediately
});
telnet.on("data", (event) => {
  // This event represents incoming data from the telnet connection.
  // Process your application input in *this* event, not the socket
  // data event.
});
```

#### IIIc. Sending Data

All of the output functions will invoke the
`telnet.on("send", callback);` event.

Note: it is very important that ALL data sent to the remote end of
the connection be passed through the `Telnet` object. All user
input or process output that you wish to send over the wire should
be given to one of the following functions. Do NOT send or buffer
unprocessed output data directly!

- `telnet.iac(command: TelnetCommand): void;`

  Sends a single "simple" TELNET command, such as the GO-AHEAD
  commands (255 249).

- `telnet.negotiate(cmd: TelnetNegotiationCommand, option: TelnetOption): void;`

  Sends a TELNET negotiation command. The cmd parameter must be one
  of `TelnetCommand.DO`, `TelnetCommand.DONT`, `TelnetCommand.WILL`,
  or `TelnetCommand.WONT`. The option parameter is the option to
  negotiate.

  Unless in PROXY mode, the RFC1143 support may delay or ellide the
  request entirely, as appropriate. It will ignore duplicate
  invocations, such as asking for WILL NAWS when NAWS is already on
  or is currently awaiting response from the remote end.

- `telnet.send(buffer: ArrayLike<number>): void`

  Sends raw data, which would be either the process output from a
  server or the user input from a client.

  For sending regular text it may be more convenient to use
  `telnet.sendText()`.

- `telnet.sendText(text: string): void`

  Sends text characters with translation of C newlines (\n) into
  CR LF and C carriage returns (\r) into CR NUL, as required by
  RFC854, unless transmission in BINARY mode has been negotiated.
  Strings will be encoded to ANSII and then writen to web assembly
  memory with a NULL character terminator.

- `subnegotiation(telopt: TelnetOption, data: ArrayLike<number>): void;`

  This method starts a subnegotiation for a telnet option. It encodes
  the provided data buffer properly for emission to the socket,
  including the end marker.

- `void telnet_finish_sb(telnet_t *telnet);`

  Sends the end marker for a TELNET sub-negotiation command. This
  must be called after (and only after) a call has been made to
  telnet_begin_subnegotiation() and any negotiation data has been
  sent.

  NOTE: telnet_subnegotiation() does have special behavior in
  PROXY mode, as in that mode this function will automatically
  detect the COMPRESS2 marker and enable zlib compression.

#### IIId. Event Handling

libtelnet-ts relies on an event-handling mechanism for processing the
parsed TELNET protocol stream as well as for buffering and sending
output data.

The event structure is detailed below.

All of the telnet events were ported from the following c struct
`telnet_event_t`. The `TelnetEvent` class is a simple wrapper and
parser for these events, and simply create object literals for
each event.

```
union telnet_event_t {
  enum telnet_event_type_t type;

  struct data_t {
    enum telnet_event_type_t _type;
    const char *buffer;
    size_t size;
  } data;

  struct error_t {
    enum telnet_event_type_t _type;
    const char *file;
    const char *func;
    const char *msg;
    int line;
    telnet_error_t errcode;
  } error;

  struct iac_t {
    enum telnet_event_type_t _type;
    unsigned char cmd;
  } iac;

  struct negotiate_t {
    enum telnet_event_type_t _type;
    unsigned char telopt;
  } neg;

  struct subnegotiate_t {
    enum telnet_event_type_t _type;
    const char *buffer;
    size_t size;
    unsigned char telopt;
  } sub;
};
```

The event values of the `Telnet` class are described in
detail below.

The only event that MUST be implemented is `"send"`. Most
applications will also always want to implement the event
`"data"`.

Here is an example event handler implementation which includes
handlers for several important events.

```ts
// incoming socket data must be written to telnet immediately
socket.on("data", (data) => telnet.receive(data));
// handle your application data buffer here
telnet.on("data", (event) => {
  handleApplicationData(event.buffer);
});
// whenever data is sent through telnet, write it to the socket
telnet.on("send", (event) => socket.write(data));
// make sure to handle telnet errors here
telnet.on("error", (event) => handleError(event));
```

- `telnet.on(event: "data", (event: IDataEvent) => void)`

  The `"data"` event is triggered whenever regular data (not part
  of any special TELNET command) is received. For a client, this
  will be process output from the server. For a server, this will
  be input typed by the user.

  The `event.buffer` value will contain the bytes received and the
  `event.size` value will contain the number of bytes received.

  NOTE: there is no guarantee that user input or server output
  will be received in whole lines. If you wish to process data
  a line at a time, you are responsible for buffering the data and
  checking for line terminators yourself!

- `telnet.on(event: "send", listener: (data: IDataEvent) => void)`

  This event is sent whenever libtelnet-t has generated data that
  must be sent over the wire to the remove end. Generally that
  means calling `socket.write()` or adding the data to your
  application's output buffer.

  The `event.buffer` value will contain the bytes to send and the
  `event.size` value will contain the number of bytes to send.
  Note that `event.buffer` is not NUL terminated.

  NOTE: Your SEND event handler must send or buffer the data in
  its raw form as provided by libtelnet. If you wish to perform
  any kind of preprocessing on data you want to send to the other

- `telnet.on(event: "iac", listener: (data: IIACEvent) => void)`

  The IAC event is triggered whenever a simple IAC command is
  received, such as the IAC EOR (end of record, also called go ahead
  or GA) command.

  The command received is in the event.cmd value.

  The necessary processing depends on the specific commands; see
  the TELNET RFC for more information.

- `telnet.on(event: "negotiate", listener: (data: INegotiationEvent) => void);`

  For `event.type` `TelnetEvent.WILL` or `TelnetEvent.DO`

  The WILL and DO events are sent when a TELNET negotiation command
  of the same name is received.

  WILL events are sent by the remote end when they wish to be
  allowed to turn an option on on their end, or in confirmation
  after you have sent a DO command to them.

  DO events are sent by the remote end when they wish for you to
  turn on an option on your end, or in confirmation after you have
  sent a WILL command to them.

  In either case, the TELNET option under negotiation will be in
  `event.telopt` field.

  libtelnet-ts manages most of the pecularities of negotiation for you.
  For information on libtelnet's negotiation method, see:

  http://www.faqs.org/rfcs/rfc1143.html

  Note that in PROXY mode libtelnet-ts will do no processing of its
  own for you.

- `telnet.on(event: "negotiate", listener: (data: INegotiationEvent) => void);`

  For `event.type` `TelnetEvent.WONT` or `TelnetEvent.DONT`

  The WONT and DONT events are sent when the remote end of the
  connection wishes to disable an option, when they are refusing to
  a support an option that you have asked for, or in confirmation of
  an option you have asked to be disabled.

  Most commonly WONT and DONT events are sent as rejections of
  features you requested by sending DO or WILL events. Receiving
  these events means the TELNET option is not or will not be
  supported by the remote end, so give up.

  Sometimes WONT or DONT will be sent for TELNET options that are
  already enabled, but the remote end wishes to stop using. You
  cannot decline. These events are demands that must be complied
  with. libtelnet-ts will always send the appropriate response back
  without consulting your application. These events are sent to
  allow your application to disable its own use of the features.

  In either case, the TELNET option under negotiation will be in
  event.telopt field.

  Note that in PROXY mode libtelnet will do no processing of its
  own for you.

- `telnet.on(event: "sb", listener: (data: ISubnegotiationEvent) => void)`

  Triggered whenever a TELNET sub-negotiation has been received.
  Sub-negotiations include the NAWS option for communicating
  terminal size to a server, the NEW-ENVIRON and TTYPE options for
  negotiating terminal features, and MUD-centric protocols such as
  ZMP, MSSP, and MCCP2.

  The `event.telopt` value is the option under sub-negotiation.
  The remaining data (if any) is passed in `event.buffer` and
  `event.size`. Note that most subnegotiation commands can include
  embedded NUL bytes in the subnegotiation data!

  The meaning and necessary processing for subnegotiations are
  defined in various TELNET RFCs and other informal specifications.
  A subnegotiation should never be sent unless the specific option
  has been enabled through the use of the telnet negotiation
  feature.

  TTYPE/ENVIRON/NEW-ENVIRON/MSSP/ZMP SUPPORT:
  libtelnet parses these subnegotiation commands. A special
  event will be sent for each, after the SUBNEGOTIATION event is
  sent. Except in special circumstances, the SUBNEGOTIATION event
  should be ignored for these options and the special events should
  be handled explicitly.

- `telnet.on(event: "compress", listener: (data: ICompressEvent) => void)`

  The COMPRESS event notifies the app that COMPRESS2/MCCP2
  compression has begun or ended. Only servers can send compressed
  data, and hence only clients will receive compressed data.

  The `event.state` value will be `true` if compression has started
  and will be `false` if compression has ended.

- `telnet.on(event: "zmp", listener: (data: IZMPEvent) => void)`

  The event.argc field is the number of ZMP parameters, including
  the command name, that have been received. The `event.argv`
  field is an array of strings, one for each ZMP parameter. The
  command name will be in `event.argv[0]`.

- `telnet.on(event: "ttype", listener: (data: ITType) => void)`

  The `event.cmd` field will be either `TTypeCommand.IS`
  or `TTypeCommand.SEND`.

  The actual terminal type will be in event.name.

- `telnet.on(event: "environ", listener: (data: IEnvironEvent) => void)`

  The `event.cmd` field will be either `TelnetEnviron.IS`,
  `TelnetEnviron.SEND`, or `TelnetEnviron.INFO`.

  The actual environment variable sent or requested will be sent
  in the `event.values` field. This is an array of `IEnvironVar`
  objects with the following format:

  ```ts
  /** An Environ var. */
  export interface IEnvironVar {
    readonly type: EnvironVarType;
    readonly var: string | null;
    readonly value: string | null;
  }
  ```

  The number of entries in the event.values array is
  stored in event.count.

  Note that libtelnet-ts does not support the ESC byte for
  ENVIRON/NEW-ENVIRON. Data using escaped bytes will not be
  parsed correctly.

- `telnet.on(event: "mssp", listener: (data: IMSSPEvent) => void)`

  The `event.values` field is an array of `IEnvironVar`
  objects. The cmd field in each entry will have an
  unspecified value, while the `var` and `value` fields will
  always be set to the MSSP variable and value being set. For
  multi-value MSSP variables, there will be multiple entries
  in the values array for each value, each with the same variable
  name set.

  The number of entries in the event.values array is
  stored in event.count.

- `telneton(event: "error", listener: (data: IErrorEvent) => void)`
  TELNET_EV_WARNING and

  The `TelnetEventType.WARNING` event is sent whenever something
  has gone wrong inside of libtelnet (possibly due to malformed
  data sent by the other end) but which recovery is (likely) possible.
  It may be safe to continue using the connection, but some data may
  have been lost or incorrectly interpreted.

  The `event.msg` field will contain a NUL terminated string
  explaining the error.

  Similar to the WARNING event, the `TelnetEventType.ERROR` event
  is sent whenever something has gone wrong. ERROR events are
  non-recoverable, however, and the application should immediately
  close the connection. Whatever has happened is likely going only
  to result in garbage from libtelnet. This is most likely to happen
  when a COMPRESS2 stream fails, but other problems can occur.

  The event.msg field will contain a NUL terminated string
  explaining the error.

## IV. Safety and correctness considerations

Your existing application may make heavy use of its own output
buffering and transmission commands, including hand-made routines for
sending TELNET commands and sub-negotiation requests. There are at
times subtle issues that need to be handled when communication over
the TELNET protocol, not least of which is the need to escape any
byte value 0xFF with a special TELNET command.

For these reasons, it is very important that applications making use
of libtelnet always make use of the libtelnet output functions for
all data being sent over the TELNET connection.

In particular, if you are writing a client, all user input must be
passed through to `telnet.send()`. This also includes any input
generated automatically by scripts, triggers, or macros.

For a server, any and all output -- including ANSI/VT100 escape
codes, regular text, newlines, and so on -- must be passed through to
`telnet.send()`.

Any TELNET commands that are to be sent must be given to one of the
following functions: `telnet.iac()`, `telnet.negotiate()`,
or `telnet.subnegotiate()`.

If you are attempting to enable COMPRESS2/MCCP2, you must use the
`telnet.beginCompress2()` function.

## V. MCCP2 compression

The MCCP2 (COMPRESS2) TELNET extension allows for the compression of
all traffic sent from server to client. For more information:

http://www.mudbytes.net/index.php?a=articles&s=mccp

`libtelnet-ts` transparently supports MCCP2. For a server to support
MCCP2, the application must begin negotiation of the COMPRESS2 option
using telnet_negotiate(), for example:

`telnet.negotiate(TelnetCommand.WILL, TelnetOption.COMPRESS2);`

If a favorable `DO COMPRESS2` is sent back from the client then the
server application can begin compression at any time by calling
`telnet.beginCompress2().

If a connection is in PROXY mode and COMPRESS2 support is enabled
then libtelnet will automatically detect the start of a COMPRESS2
stream, in either the sending or receiving direction.

## VI. Zenith MUD Protocol (ZMP) support

This feature is not enabled for libtelnet-ts yet, but the following
docs and methods will be enabled soon.

The Zenith MUD Protocol allows applications to send messages across
the TELNET connection outside of the normal user input/output data
stream. libtelnet offers some limited support for receiving and
sending ZMP commands to make implementing a full ZMP stack easier.
For more information on ZMP:

http://zmp.sourcemud.org/

For a server to enable ZMP, it must send the WILL ZMP negotitaion:

`telnet.negotiate(TelnetCommand.WILL, TelnetOption.ZMP);`

For a client to support ZMP it must include ZMP in the telopt table
as follows:

```ts
table.support(TelnetOption.ZMP, false, true);
```

Note that while ZMP is a bi-directional protocol, it is only ever
enabled on the server end of the connection. This automatically
enables the client to send ZMP commands. The client must never
attempt to negotiate ZMP directly using telnet_negotiate().

Once ZMP is enabled, any ZMP commands received will automatically be
sent to the event handler function with the TELNET_EV_SUBNEGOTIATION
event code. The command will automatically be parsed and the ZMP
parameters will be placed in the `event.argv` array and the number of
parameters will be placed in the `event.argc` field.

NOTE: if an error occured while parsing the ZMP command because it
was malformed, the `event.argc` field will be equal to 0 and the
`event.argv` field will be `null`. You should always check for this
before attempting to access the parameter array.

To send ZMP commands to the remote end, use `telnet.sendzmp()`.

- `telnet.zmp(command: string, argv: string[]): void;`

  Sends a ZMP command to the remote end. The command parameter
  is required, but the argv parameter is optional. The argv array
  contains the parameters.

## VII. MUD Server Status Protocol (MSSP) support

MSSP allows for crawlers or other clients to query a MUD server's
supported feature list. This allows MUD listing states to
automatically stay up to date with the MUD's features, and not
require MUD administrators to manually update listing sites for
their MUD. For more information on MSSP:

http://tintin.sourceforge.net/mssp/
