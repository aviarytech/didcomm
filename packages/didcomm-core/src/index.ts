import axios from "axios";
import { IDIDDocument } from "@aviarytech/did-core";
import {
  DIDCommMessageMediaType,
  IDIDCommEncryptedMessage,
  IDIDCommPlaintextPayload,
} from "./interfaces";
import { JWE } from "@transmute/jose-ld";
import { JsonWebKey } from "@transmute/json-web-signature";

export class DIDComm {
  constructor() {}

  static getDIDCommService(didDoc: IDIDDocument) {
    const service = didDoc.service.find((s) => s.type === "DIDCommMessaging");
    if (!service) {
      throw Error(`Incompatible DID '${didDoc.id}', no 'DIDCommMessaging' service`);
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

  async createMessage(
    didDoc: IDIDDocument,
    msg: IDIDCommPlaintextPayload
  ): Promise<IDIDCommEncryptedMessage> {
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

      const jwk = await JsonWebKey.from({
        id: key.id,
        type: "JsonWebKey2020",
        controller: key.controller,
        publicKeyJwk: key.publicKeyJwk,
      });
      const recipients = [
        {
          header: {
            kid: key.id,
            alg: "ECDH-ES+A256KW",
          },
        },
      ];

      const cipher = new JWE.Cipher(jwk);
      const jwe = await cipher.encryptObject({
        obj: document,
        recipients,
        publicKeyResolver: async (id: string) => {
          if (id === key.id) {
            return key;
          }
          throw new Error("publicKeyResolver does not suppport IRI " + JSON.stringify(id));
        },
      });

      return { mediaType: DIDCommMessageMediaType.ENCRYPTED, ...jwe };
    } catch (e) {
      throw e;
    }
  }

  async sendMessage(didDoc: IDIDDocument, msg: IDIDCommEncryptedMessage): Promise<boolean> {
    const service = DIDComm.getDIDCommService(didDoc);
    if (typeof service.serviceEndpoint !== "string") {
      // TODO log actual thing here so we can see what an obj looks like in practice
      throw Error("Only service endpoints that are strings are supported");
    }
    try {
      const resp = await axios.post(service.serviceEndpoint, msg, {
        headers: { "Content-Type": msg.mediaType },
      });
      return resp.status === 200 || resp.status === 201;
    } catch (e) {
      console.log(`error sending didcomm message to ${service.serviceEndpoint}`);
      console.log(e.response);
      return false;
    }
  }

  async decryptMessageJWK(
    encryptedMsg: IDIDCommEncryptedMessage,
    jwk: JsonWebKey
  ): Promise<IDIDCommPlaintextPayload> {
    const cipher = new JWE.Cipher(jwk);
    const msg = await cipher.decrypt({ encryptedMsg, jwk });
    return JSON.parse(msg.toString()) as IDIDCommPlaintextPayload;
  }

  async unpackMessage(
    mediaType: string,
    key: JsonWebKey,
    msg: IDIDCommEncryptedMessage
  ): Promise<IDIDCommPlaintextPayload> {
    if (mediaType === DIDCommMessageMediaType.ENCRYPTED) {
      if (key.type === "JsonWebKey2020") {
        const decodedMessage = await this.decryptMessageJWK(msg, key);
        return decodedMessage;
      } else {
        throw new Error(`Non JWK unpacking not yet supported`);
      }
    } else if (mediaType === DIDCommMessageMediaType.SIGNED) {
      // not yet supported.
      throw new Error(`${mediaType} not supported in WACI-PEx v0.1`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
