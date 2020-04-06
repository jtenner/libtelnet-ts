const {
  Telnet,
  TelnetOption,
  TelnetCommand,
  TelnetEventType,
  TelnetErrorCode,
  TTypeCommand,
  EnvironCommand,
} = require("../lib");

const glob = require("glob");
const fs = require("fs");
const path = require("path");
const diff = require("diff");

const teloptSupport = [
  [TelnetOption.TELNET_TELOPT_COMPRESS2, true, false],
  [TelnetOption.TELNET_TELOPT_ZMP, true, false],
  [TelnetOption.TELNET_TELOPT_MSSP, true, false],
  [TelnetOption.TELNET_TELOPT_NEW_ENVIRON, true, false],
  [TelnetOption.TELNET_TELOPT_TTYPE, true, false],
];

function createWritable() {
  const writable = {
    value: "",
    write(text) {
      writable.value += text;
    },
  };
  return writable;
}

const inputFiles = glob.sync("test/*.input");

const createSnap = process.argv.includes("--create");

Telnet.runtimeInitialized = () => {
  inputFiles.forEach((file) => {
    const writable = createWritable();
    const contents = fs.readFileSync(file, "utf8");
    process.stdout.write(`File: ${file}\n`);
    const lines = contents
      .split(/\n/g)
      .filter(Boolean)
      .filter((line) => !line.startsWith("#"));
    const telnet = new Telnet(teloptSupport);
    const snapfile =
      path.join(path.dirname(file), path.basename(file, ".input")) + ".snap";

    telnet.on("compress", (event) =>
      writable.write(`Compression: ${event.state}\n`),
    );
    telnet.on("data", (event) => {
      const str = Buffer.from(event.buffer).toString();
      writable.write(
        `Data: ${TelnetEventType[event.type]} => ${str} = [bytes] ${Array.from(
          event.buffer,
        )}\n`,
      );
    });
    telnet.on("environ", (event) => {
      writable.write(`Environ: ${EnvironCommand[event.cmd]}\n`);
      event.values.forEach((env) => {
        writable.write(`  Var: ${env.var} | Value: ${env.value}\n`);
      });
    });
    telnet.on("error", (event) =>
      writable.write(
        `Error: ${TelnetEventType[event.type]} ${
          TelnetErrorCode[event.errcode]
        } ${event.msg}\n`,
      ),
    );
    telnet.on("iac", (event) =>
      writable.write(`IAC: ${TelnetCommand[event.cmd]}\n`),
    );
    telnet.on("mssp", (event) => {
      writable.write("MSSP:\n");
      event.values.forEach((env) => {
        writable.write(`  Var: ${env.var} | Value: ${env.value}\n`);
      });
    });
    telnet.on("negotiate", (event) =>
      writable.write(
        `Negotiate: ${TelnetEventType[event.type]} ${
          TelnetOption[event.telopt]
        }\n`,
      ),
    );
    telnet.on("sb", (event) =>
      writable.write(
        `Subnegotiation: ${TelnetOption[event.telopt]} ${Array.from(
          event.buffer,
        )}\n`,
      ),
    );
    telnet.on("ttype", (event) =>
      writable.write(`TType: ${TTypeCommand[event.cmd]} ${event.name}\n`),
    );
    telnet.on("zmp", (event) => writable.write(`ZMP: ${event.argv}\n`));

    lines.forEach((line) => {
      const buffer = [];
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "%") {
          buffer.push(parseInt(line.slice(i + 1, i + 3), 16));
          i += 2;
        } else {
          buffer.push(line.charCodeAt(i));
        }
      }
      telnet.receive(buffer);
    });

    if (createSnap) {
      fs.writeFileSync(snapfile, writable.value);
    } else {
      const snapfileContents = fs.readFileSync(snapfile, "utf8");
      if (snapfileContents !== writable.value) {
        process.stdout.write("\n");
        const changes = diff.diffLines(snapfileContents, writable.value);

        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          if (change.added) {
            process.stdout.write(`+ ${change.value}`);
          } else if (change.removed) {
            process.stdout.write(`- ${change.value}`);
          } else {
            process.stdout.write(`  ${change.value}`);
          }
        }

        process.exit(1);
      } else {
        process.stdout.write(`[Success]\n\n`);
      }
    }
  });
};
