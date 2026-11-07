import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });
const password = await rl.question("New unique vault password (input may be visible in terminal): ");
rl.close();
if (password.length < 16) {
  console.error("Use at least 16 characters.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256");
console.log(`${salt.toString("base64")}:${hash.toString("base64")}`);
