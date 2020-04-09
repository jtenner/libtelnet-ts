const {
  Telnet,
  TelnetOption,
  TelnetCommand,
  TelnetEventType,
  TelnetErrorCode,
  TTypeCommand,
  EnvironCommand,
  CompatibilityTable,
  EnvironVarType,
} = require("../lib");

const glob = require("glob");
const fs = require("fs");
const path = require("path");
const diff = require("diff");

function bytesToString(bytes) {
  return `"` + Buffer.from(bytes).toString().replace(/"/g, `\\"`) + `"`;
}

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

Telnet.ready.then(() => {
  const teloptSupport = CompatibilityTable.create()
    .support(TelnetOption.BINARY, true, true)
    .support(TelnetOption.COMPRESS2, true, false)
    .support(TelnetOption.ZMP, true, false)
    .support(TelnetOption.MSSP, true, false)
    .support(TelnetOption.NEW_ENVIRON, true, false)
    .support(TelnetOption.TTYPE, true, false)
    .finish();

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
    telnet.on("send", (event) => {
      writable.write(
        `Send: ${bytesToString(event.buffer)} = [bytes] ${Array.from(
          event.buffer,
        )}\n`,
      );
    });
    telnet.on("data", (event) => {
      writable.write(
        `Data: ${bytesToString(event.buffer)} = [bytes] ${Array.from(
          event.buffer,
        )}\n`,
      );
    });
    telnet.on("environ", (event) => {
      writable.write(`Environ: ${EnvironCommand[event.cmd]}\n`);
      event.values.forEach((env) => {
        writable.write(
          `  ${EnvironVarType[env.type]}: "${env.var}"${
            env.value ? ` = "${env.value}"` : ``
          }\n`,
        );
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
        writable.write(
          `  ${EnvironVarType[env.type]}: "${env.var}"${
            env.value ? ` = "${env.value}"` : ``
          }\n`,
        );
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
        const changes = diff.diffLines(snapfileContents, writable.value);

        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const lineStart = change.added
            ? "\n+ "
            : change.removed
            ? "\n- "
            : "\n  ";
          process.stdout.write(
            `${lineStart}${change.value.split("\n").join(lineStart)}`,
          );
        }
        process.stdout.write("\n");
        process.exit(1);
      } else {
        process.stdout.write(`[Success]\n\n`);
      }
    }
    telnet.dispose();
  });
});
