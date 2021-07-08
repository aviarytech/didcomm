import { FlattenedEncrypt, FlattenedJWE } from "jose/jwe/flattened/encrypt";
import { JWK, parseJwk } from "jose/jwk/parse";
import { flattenedDecrypt } from "jose/jwe/flattened/decrypt";
import axios from "axios";
import { IDIDDocument } from "@aviarytech/did-core";
import {
  DIDCommMessageMediaType,
  IDIDCommEncryptedMessage,
  IDIDCommPlaintextPayload,
} from "./interfaces";

export class DIDComm {
  constructor() {}

  static getDIDCommService(didDoc: IDIDDocument) {
    const service = didDoc.service.find((s) => s.type === "DIDCommMessaging");
    if (!service) {
      throw Error(`Incompatible DID '${didDoc.id}', no 'DIDCommMessaging'service`);
    }
    return service;
  }

  static getKeyIdFromMessage(msg: IDIDCommEncryptedMessage) {
    const prot = JSON.parse(Buffer.from(msg.protected, "base64").toString("utf-8"));
    if (!prot["kid"]) {
      throw Error("kid not found in the message protected field");
    }
    return prot["kid"];
  }

  async createMessage(didDoc: IDIDDocument, msg: IDIDCommPlaintextPayload): Promise<FlattenedJWE> {
    try {
      const service = DIDComm.getDIDCommService(didDoc);
      if (service.routingKeys.length > 1) {
        throw Error(`Multiple DIDComm routing keys not yet supported`);
      }
      if (service.routingKeys.length === 0) {
        throw Error(`No DIDComm routing key entry found in service block`);
      }
      const key = didDoc.verificationMethod.find((v) => v.id === service.routingKeys[0]);
      if (!key) {
        throw Error(`DIDComm routing key not found in verification methods`);
      }

      const encoder = new TextEncoder();
      const jwk = await parseJwk(key.publicKeyJwk, "ECDH-ES+A256KW");
      const jwe = await new FlattenedEncrypt(encoder.encode(JSON.stringify(msg)))
        .setProtectedHeader({
          alg: "ECDH-ES+A256KW",
          kid: key.id,
          typ: DIDCommMessageMediaType.ENCRYPTED,
          enc: "A256GCM",
        })
        .encrypt(jwk);
      return jwe;
    } catch (e) {
      throw e;
    }
  }

  async sendMessage(didDoc: IDIDDocument, msg: FlattenedJWE): Promise<boolean> {
    const service = DIDComm.getDIDCommService(didDoc);
    if (typeof service.serviceEndpoint !== "string") {
      // TODO log actual thing here so we can see what an obj looks like in practice
      throw Error("Only service endpoints that are strings are supported");
    }
    try {
      const resp = await axios.post(service.serviceEndpoint, msg, {
        headers: { "Content-Type": DIDCommMessageMediaType.ENCRYPTED },
      });
      return resp.status === 200 || resp.status === 201;
    } catch (e) {
      console.log(`error sending didcomm message to ${service.serviceEndpoint}`);
      console.log(e.response);
      return false;
    }
  }

  async decryptMessageJWK(
    msg: IDIDCommEncryptedMessage,
    jwk: JWK
  ): Promise<IDIDCommPlaintextPayload> {
    const key = await parseJwk(jwk, "ECDH-ES+A256KW");
    const decoder = new TextDecoder();
    const { plaintext, protectedHeader, additionalAuthenticatedData } = await flattenedDecrypt(
      msg,
      key
    );
    return JSON.parse(decoder.decode(plaintext)) as IDIDCommPlaintextPayload;
  }

  async unpackMessage(
    mediaType: string,
    key: JWK,
    msg: IDIDCommEncryptedMessage
  ): Promise<IDIDCommPlaintextPayload> {
    if (mediaType === DIDCommMessageMediaType.ENCRYPTED) {
      if (key.alg && key.crv) {
        const decodedMessage = await this.decryptMessageJWK(msg, key);
        return decodedMessage;
      } else {
        throw new Error(`Non JWK unpacking not yet supported`);
      }
    } else if (mediaType === DIDCommMessageMediaType.SIGNED) {
      // not yet supported
      throw new Error(`${mediaType} not supported in WACI-PEx v0.1`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
