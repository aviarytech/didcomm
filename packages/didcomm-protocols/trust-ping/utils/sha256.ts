import { hash } from "@stablelib/sha256";

export const sha256 = (val: string) => {
  return Buffer.from(hash(Buffer.from(val))).toString("hex");
};
