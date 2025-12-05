import crypto from "crypto";

export function hashText(...text: string[]) {
  return crypto
    .createHash("sha256")
    .update(text.join(""))
    .digest("hex");
}
