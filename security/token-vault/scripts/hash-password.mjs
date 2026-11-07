import { pbkdf2Sync, randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";

if (!stdin.isTTY || !stdin.setRawMode) {
  console.error("Run in an interactive terminal so the password can be entered without echo.");
  process.exit(1);
}
stdout.write("New unique vault password (hidden): ");
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding("utf8");
let password = "";
stdin.on("data", (chunk) => {
  for (const char of chunk) {
    if (char === "\\u0003") {
      stdout.write("\\nCancelled.\\n");
      process.exit(130);
    }
    if (char === "\\r" || char === "\\n") {
      stdin.setRawMode(false);
      stdin.pause();
      const salt = randomBytes(16);
      const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256");
      stdout.write("\\nPBKDF2-SHA256 salt:hash (store only as Worker secret):\\n");
      stdout.write(`${salt.toString("base64")}:${hash.toString("base64")}\\n`);
      password = "";
      return;
    }
    if (char === "\\u007f" || char === "\\b") password = password.slice(0, -1);
    else password += char;
  }
});
