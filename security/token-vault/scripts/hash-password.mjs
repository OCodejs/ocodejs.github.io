import { pbkdf2Sync, randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";

if (!stdin.isTTY || !stdin.setRawMode) {
  console.error("Run in an interactive terminal so the password can be entered without echo.");
  process.exit(1);
}

stdout.write("New unique vault password (hidden, minimum 16 characters): ");
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding("utf8");

let password = "";
let finished = false;

function finish() {
  if (finished) return;
  finished = true;
  stdin.setRawMode(false);
  stdin.pause();
  if (password.length < 16) {
    password = "";
    stdout.write("\nPassword must contain at least 16 characters. No hash was generated.\n");
    process.exitCode = 1;
    return;
  }
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, 310000, 32, "sha256");
  password = "";
  stdout.write("\nPBKDF2-SHA256 salt:hash (store only as Worker secret):\n");
  stdout.write(salt.toString("base64") + ":" + derived.toString("base64") + "\n");
}

stdin.on("data", chunk => {
  for (const char of chunk) {
    const code = char.charCodeAt(0);
    if (code === 3) {
      password = "";
      stdin.setRawMode(false);
      stdout.write("\nCancelled.\n");
      process.exit(130);
    }
    if (code === 13 || code === 10) {
      finish();
      return;
    }
    if (code === 127 || code === 8) password = password.slice(0, -1);
    else if (code >= 32) password += char;
  }
});
