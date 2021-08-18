import axios from "axios";
import { IDIDDocument, IDIDResolver } from "@aviarytech/did-core";
import {
  IDIDCommMessage,
  IDIDCommMessageHandler,
  IDIDCommPayload,
} from "./interfaces";
import { X25519KeyAgreementKey2019 } from "@transmute/x25519-key-pair";
import { EventBus } from "./utils/event-bus";
// import { decryptMessage } from "./decryption";
// import { encryptMessage } from "./encryption";
import {
  IJWE,
  JsonWebKey,
  JsonWebKey2020,
  JWE,
  X25519KeyPair,
} from "@aviarytech/crypto-core";
import { DIDCommMessageMediaType } from "./constants";
import { ISecretResolver } from "@aviarytech/did-secrets";
import { BaseKeyPair } from "@aviarytech/crypto-core/dist/keypairs/BaseKeyPair";

export class DIDCommCore {
  private messageBus: EventBus;

  constructor(
    private messageHandlers: IDIDCommMessageHandler[],
    private didResolver: IDIDResolver,
    private secretResolver: ISecretResolver
  ) {
    this.messageBus = new EventBus();
    messageHandlers.forEach((eventType, handler) => {
      console.log(eventType);
      console.log(handler);
    });
    // for (const [eventType, handler] of messageHandlers) {
    //   this.messageBus.register(eventType, handler);
    // }
  }

  handleMessage(message: IDIDCommMessage): void {
    this.messageBus.dispatch(message.payload.type, message);
  }

  async createMessage(to: string, payload: IDIDCommPayload): Promise<IJWE> {
    try {
      // get the key agreement keys
      const didDoc = await this.didResolver.resolve(to);
      const kaks = didDoc.getAllKeyAgreements();

      const cipher = new JWE.Cipher();
      const encrypter = cipher.createEncrypter();
      const publicKeyResolver = (id: string) => {
        const key = kaks.find((k) => id === k.id);
        if (key) {
          return key.asJsonWebKey();
        }
        throw new Error(
          "publicKeyResolver does not suppport IRI " + JSON.stringify(id)
        );
      };

      const recipients = kaks.map((k) => {
        return {
          header: {
            kid: k.id,
            alg: "ECDH-ES+A256KW",
          },
        };
      });

      const jwe = await encrypter.encrypt({
        data: payload,
        recipients,
        publicKeyResolver,
      });

      return jwe;

      // const msg = suite.encryptObject({
      //   obj: payload,
      //   recipients,
      //   publicKeyResolver: async (id: string) => {
      //     const key = kaks.find((k) => id === k.id);
      //     if (key) {
      //       return key;
      //     }
      //     throw new Error(
      //       "publicKeyResolver does not suppport IRI " + JSON.stringify(id)
      //     );
      //   },
      // });

      // const service = didDoc.getServiceByType("DIDCommMessaging");
      // // if (service.routingKeys.length > 1) {
      // //   throw Error(`Multiple DIDComm routing keys not yet supported`);
      // // }
      // // if (service.routingKeys.length === 0) {
      // //   throw Error(`No DIDComm routing key entry found in service block`);
      // // }

      // // get the proper key
      // const key = didDoc.verificationMethod.find(
      //   (v) => v.id === service.routingKeys[0]
      // );
      // if (!key) {
      //   throw Error(`DIDComm routing key not found in verification methods`);
      // }

      // // encrypt
      // const jwe = await encryptMessage(msg, key);

      // return { mediaType: DIDCommMessageMediaType.ENCRYPTED, ...jwe };
    } catch (e) {
      throw e;
    }
  }

  async sendMessage(
    didDoc: IDIDDocument,
    msg: IJWE,
    serviceId?: string
  ): Promise<boolean> {
    const service = serviceId
      ? didDoc.getServiceById(serviceId)
      : didDoc.getServiceByType("DIDCommMessaging");
    if (typeof service.serviceEndpoint !== "string") {
      throw Error("Only string service endpoints are supported");
    }
    try {
      const resp = await axios.post(service.serviceEndpoint, msg, {
        headers: { "Content-Type": DIDCommMessageMediaType.ENCRYPTED },
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
    msg: IDIDCommMessage
  ): Promise<IDIDCommPayload> {
    if (mediaType === DIDCommMessageMediaType.ENCRYPTED) {
      // return await decryptMessage(msg, key);
    } else if (mediaType === DIDCommMessageMediaType.SIGNED) {
      // not yet supported.
      throw new Error(`${mediaType} not yet supported`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
