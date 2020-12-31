import { DIDComm as EncryptionEnvelope } from "encryption-envelope-js";
import sodium from "libsodium-wrappers";
import bs58 from "bs58";

export class DIDComm {
  public encryptionEnvelope: EncryptionEnvelope;

  constructor() {
    this.encryptionEnvelope = new EncryptionEnvelope();
  }

  private b64url(input: any) {
    return sodium.to_base64(input, sodium.base64_variants.URLSAFE);
  }

  /**
   * Signs a message for non-repudiation
   *
   * @param msg - message to be signed
   * @param signerPubKey - Signer public key (Base58 encoded)
   * @param signerPrivKey - Signer private key (Base58 encoded)
   */
  private async signMessage(msg: string, pubKey: string, privKey: string): Promise<string> {
    // generate jose header, b64url encode it, and concat to b64url encoded payload
    const joseHeader = {
      alg: "EdDSA",
      kid: pubKey,
      jwk: {
        kty: "OKP",
        x: Buffer.from(bs58.decode(pubKey)).toString("base64"),
      },
    };
    const joseString = JSON.stringify(joseHeader);
    const b64JoseStr = this.b64url(joseString);
    const b64Payload = this.b64url(msg);
    const headerAndPayloadConcat = `${b64JoseStr}.${b64Payload}`;

    // sign data and return compact JWS
    const signature = this.b64url(sodium.crypto_sign(headerAndPayloadConcat, bs58.decode(privKey)));
    return `${headerAndPayloadConcat}.${signature}`;
  }

  /**
   * Packs a message for DIDComm messaging
   *
   * @param message - The message to be sent
   * @param pubKey - The sender's public key (base58 encoded)
   * @param privKey -  The sender's private key (base58 encoded)
   * @param theirPubKey -  The receivers's public key (base58 encoded)
   * @returns The packed message ready to be sent
   *
   * @beta
   */
  public packMessage = async (
    message: string,
    pubKey: string,
    privKey: string,
    theirPubKey: string
  ) => {
    await this.encryptionEnvelope.Ready;
    const jws = this.signMessage(message, pubKey, privKey);
    // const protectedHeader = Buffer.from(
    //   JSON.stringify({
    //     alg: "EdDSA",
    //     jwk: {
    //       kty: "OKP",
    //       x: Buffer.from(pubKey).toString("base64"),
    //     },
    //   })
    // )
    //   .toString("base64")
    //   .split("=")[0];
    // const b64Message = Buffer.from(JSON.stringify(message)).toString("base64").split("=")[0];
    // const msgVal = protectedHeader + "." + b64Message;
    // const sig = ed25519.sign(keys.privateKey, Buffer.from(msgVal, "ascii"));
    // const sigHex = await ed.sign(msgVal, keys.privateKey);
    // const b64Sig = Buffer.from(sig).toString("base64").split("=")[0];
    // const urlSig = encode(b64Sig);
    // const id = (await genKey("a51", random)).pubHash;
    // console.log(id);
    return await this.encryptionEnvelope.packMessage(message, [bs58.decode(theirPubKey)], {
      keyType: "ed25519",
      publicKey: bs58.decode(pubKey),
      privateKey: bs58.decode(privKey),
    });
  };
}
