import axios from "axios";
import { IDIDDocument } from "@aviarytech/did-core";
import {
  DIDCommMessageMediaType,
  IDIDCommEncryptedMessage,
  IDIDCommPlaintextPayload,
} from "./interfaces";
import { JWE } from "@transmute/jose-ld";
import { JsonWebKey } from "@transmute/json-web-signature";
import {
  X25519KeyAgreementKey2019,
  X25519KeyPair,
} from "@transmute/x25519-key-pair";
import { EventBus } from "./utils/event-bus";
import { getKeyPairForType } from "./utils/keypair-utils";

export class DIDComm {
  private messageBus: EventBus;

  constructor(private messageHandlers: Map<string, Function> = new Map()) {
    this.messageBus = new EventBus();
    for (const [eventType, handler] of messageHandlers) {
      this.messageBus.register(eventType, handler);
    }
  }

  static getDIDCommService(didDoc: IDIDDocument, id?: string) {
    const service = id
      ? didDoc.service.find((s) => s.id === id && s.type === "DIDCommMessaging")
      : didDoc.service.find((s) => s.type === "DIDCommMessaging");
    if (!service) {
      throw Error(`DIDComm service block not found`);
    }
    return service;
  }

  static getKeyIdFromMessage(msg: IDIDCommEncryptedMessage) {
    try {
      return msg.recipients[0]["header"]["kid"];
    } catch {
      throw Error("kid not found in the first recipient header field");
    }
  }

  handleMessage(message: IDIDCommPlaintextPayload) {
    this.messageBus.dispatch(message.type, message);
  }

  async createMessage(
    didDoc: IDIDDocument,
    msg: IDIDCommPlaintextPayload,
    serviceId?: string
  ): Promise<IDIDCommEncryptedMessage> {
    try {
      // get the service block
      const service = DIDComm.getDIDCommService(didDoc, serviceId);
      if (service.routingKeys.length > 1) {
        throw Error(`Multiple DIDComm routing keys not yet supported`);
      }
      if (service.routingKeys.length === 0) {
        throw Error(`No DIDComm routing key entry found in service block`);
      }

      // get the proper key
      const key = didDoc.verificationMethod.find(
        (v) => v.id === service.routingKeys[0]
      );
      if (!key) {
        throw Error(`DIDComm routing key not found in verification methods`);
      }

      // encrypt
      const cipher = new JWE.Cipher(getKeyPairForType(key));
      const recipients = [
        {
          header: {
            kid: key.id,
            alg: "ECDH-ES+A256KW",
          },
        },
      ];

      const jwe = await cipher.encryptObject({
        obj: msg,
        recipients,
        publicKeyResolver: async (id: string) => {
          if (id === key.id) {
            return key;
          }
          throw new Error(
            "publicKeyResolver does not suppport IRI " + JSON.stringify(id)
          );
        },
      });

      return { mediaType: DIDCommMessageMediaType.ENCRYPTED, ...jwe };
    } catch (e) {
      throw e;
    }
  }

  async sendMessage(
    didDoc: IDIDDocument,
    msg: IDIDCommEncryptedMessage,
    serviceId?: string
  ): Promise<boolean> {
    const service = DIDComm.getDIDCommService(didDoc, serviceId);
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
      console.log(
        `error sending didcomm message to ${service.serviceEndpoint}`
      );
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

  async decryptMessageX25519(
    encryptedMsg: IDIDCommEncryptedMessage,
    keyPair: X25519KeyPair
  ): Promise<IDIDCommPlaintextPayload> {
    const cipher = new JWE.Cipher(X25519KeyPair);
    const msg = await cipher.decryptObject({
      jwe: encryptedMsg,
      keyAgreementKey: keyPair,
    });
    return msg as IDIDCommPlaintextPayload;
  }

  async unpackMessage(
    mediaType: string,
    key: JsonWebKey | X25519KeyAgreementKey2019,
    msg: IDIDCommEncryptedMessage
  ): Promise<IDIDCommPlaintextPayload> {
    if (mediaType === DIDCommMessageMediaType.ENCRYPTED) {
      if (key.type === "JsonWebKey2020") {
        return await this.decryptMessageJWK(msg, key as JsonWebKey);
      }
      if (key.type === "X25519KeyAgreementKey2019") {
        return await this.decryptMessageX25519(
          msg,
          await X25519KeyPair.from(key as X25519KeyAgreementKey2019)
        );
      }
      throw new Error(`key type ${key.type} not supported`);
    } else if (mediaType === DIDCommMessageMediaType.SIGNED) {
      // not yet supported.
      throw new Error(`${mediaType} not yet supported`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
