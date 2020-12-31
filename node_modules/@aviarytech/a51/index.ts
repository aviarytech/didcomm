import * as ed25519 from "@stablelib/ed25519";
import { Bls12381G2KeyPair } from "@mattrglobal/bls12381-key-pair";
import { hash } from "@stablelib/sha256";
import b58 from "b58";
import crypto from "crypto";

/* work methods */
export const didSov = (target: string, pubKey: Uint8Array): boolean => {
  const keyStr = b58.encode(pubKey.slice(16));
  return keyStr.substr(0, target.length) === target;
};
export const didKey = (target: string, pubKey: Uint8Array): boolean => {
  const keyStr = b58.encode(pubKey);
  return keyStr.substr(0, target.length) === target;
};
export const sha256Hash = (target: string, pubKey: Uint8Array): boolean => {
  const keyStr = Buffer.from(hash(pubKey)).toString("hex");
  return keyStr.substr(0, target.length) === target;
};
export const noWork = (target: string, pubKey: Uint8Array): boolean => {
  return true;
};

/* key methods */
export const genEd25519 = async (): Promise<{ priv: Uint8Array; pub: Uint8Array }> => {
  const key = ed25519.generateKeyPair();
  return { priv: key.secretKey, pub: key.publicKey };
};
export const genBls12381 = async (): Promise<{ priv: Uint8Array; pub: Uint8Array }> => {
  const key = await Bls12381G2KeyPair.generate();
  return { priv: key.privateKeyBuffer, pub: key.publicKeyBuffer };
};
export const random = async (): Promise<{ priv: Uint8Array; pub: Uint8Array }> => {
  const rand = crypto.randomBytes(16);
  return { priv: rand, pub: rand };
};

/* key generator method - recursively searches for a key pair that matches the specified requirements */
export const genKey = async (
  target: string,
  keyGenMethod: () => Promise<{ priv: Uint8Array; pub: Uint8Array }> = genEd25519,
  workMethod: (target: string, pubKey: Uint8Array) => boolean = sha256Hash
): Promise<{ priv: string; privHash: string; pub: string; pubHash: string }> => {
  const key = await keyGenMethod();
  if (workMethod(target, key.pub)) {
    return {
      priv: b58.encode(key.priv),
      privHash: Buffer.from(hash(key.priv)).toString("hex"),
      pub: b58.encode(key.pub),
      pubHash: Buffer.from(hash(key.pub)).toString("hex"),
    };
  }
  return genKey(target, keyGenMethod, workMethod);
};
