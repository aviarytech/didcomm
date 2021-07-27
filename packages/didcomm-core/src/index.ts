import axios from "axios";
import { IDIDDocument } from "@aviarytech/did-core";
import {
  DIDCommMessageMediaType,
  IDIDCommEncryptedMessage,
  IDIDCommPlaintextPayload,
  JsonWebKey2020,
} from "./interfaces";
import { JsonWebKey } from "@transmute/json-web-signature";
import {
  X25519KeyAgreementKey2019,
  X25519KeyPair,
} from "@transmute/x25519-key-pair";
import { EventBus } from "./utils/event-bus";
import { getKeyPairForType } from "./utils/keypair-utils";
import CompactEncrypt from "jose/jwe/compact/encrypt";
import parseJwk from "jose/jwk/parse";
import { decryptMessage } from "./utils/decryption";
import { encryptMessage } from "./utils/encryption";

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
      const jwe = await encryptMessage(msg, key);

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

  async unpackMessage(
    mediaType: string,
    key: JsonWebKey2020 | X25519KeyAgreementKey2019,
    msg: IDIDCommEncryptedMessage
  ): Promise<IDIDCommPlaintextPayload> {
    if (mediaType === DIDCommMessageMediaType.ENCRYPTED) {
      return await decryptMessage(msg, key);
    } else if (mediaType === DIDCommMessageMediaType.SIGNED) {
      // not yet supported.
      throw new Error(`${mediaType} not yet supported`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
