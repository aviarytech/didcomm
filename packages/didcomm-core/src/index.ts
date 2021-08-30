import axios from "axios";
import { IDIDDocument, IDIDResolver } from "@aviarytech/did-core";
import {
  IDIDCommMessage,
  IDIDCommMessageHandler,
  IDIDCommPayload,
} from "./interfaces";
import { EventBus } from "./utils/event-bus";
import { IJWE, JWE } from "@aviarytech/crypto-core";
import { DIDCommMessageMediaType } from "./constants";
import { ISecretResolver } from "@aviarytech/did-secrets";

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

  async packMessage(payload: IDIDCommPayload): Promise<IJWE> {
    try {
      // get the key agreement keys
      const didDoc = await this.didResolver.resolve(payload.to);
      let kaks = didDoc.getAllKeyAgreements();

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
    jwe: IJWE,
    mediaType: DIDCommMessageMediaType
  ): Promise<IDIDCommPayload> {
    if (mediaType === DIDCommMessageMediaType.ENCRYPTED) {
      const cipher = new JWE.Cipher();
      const decrypter = cipher.createDecrypter();
      let keys = await Promise.all(
        jwe.recipients.map((r) => this.secretResolver.resolve(r.header.kid))
      );
      keys = keys.filter((k) => k);
      if (keys.length === 0) {
        throw new Error(`No matching keys found in the recipients list`);
      }
      const jwk = await keys[0].asJsonWebKey();
      const keyAgreementKey = await jwk.export({
        privateKey: true,
        type: "X25519KeyAgreementKey2019",
      });
      try {
        return decrypter.decrypt({ jwe, keyAgreementKey });
      } catch (e) {
        // console.log(e);
      }
    } else if (mediaType === DIDCommMessageMediaType.SIGNED) {
      // not yet supported.
      throw new Error(`${mediaType} not yet supported`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
