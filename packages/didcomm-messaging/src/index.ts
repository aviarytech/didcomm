import axios from "axios";
import { IDIDDocument, IDIDResolver } from "@aviarytech/did-core";
import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "./interfaces";
import { EventBus } from "./utils/event-bus";
import { IJWE, JWE } from "@aviarytech/crypto-core";
import { ISecretResolver } from "@aviarytech/did-secrets";
import {
  DIDCommCore,
  IDIDCommCore,
  DIDCOMM_MESSAGE_MEDIA_TYPE,
} from "@aviarytech/didcomm-core";

export class DIDComm implements IDIDComm {
  private messageBus: EventBus;
  private core: IDIDCommCore;

  constructor(
    private messageHandlers: IDIDCommMessageHandler[],
    private didResolver: IDIDResolver,
    private secretResolver: ISecretResolver
  ) {
    this.core = new DIDCommCore(didResolver, secretResolver);
    this.messageBus = new EventBus();
    messageHandlers.forEach((handler) => {
      this.messageBus.register(handler.type, handler.handle);
    });
  }

  handleMessage(message: IDIDCommMessage): boolean {
    if (this.messageHandlers.find((h) => h.type === message.payload.type)) {
      this.messageBus.dispatch(message.payload.type, message);
      return true;
    }
    return false;
  }

  async sendMessage(
    msg: IDIDCommMessage,
    serviceId?: string
  ): Promise<boolean> {
    const packedMsg = await this.core.packMessage(msg.payload);

    const didDoc = await this.didResolver.resolve(msg.payload.to);

    const service = serviceId
      ? didDoc.getServiceById(serviceId)
      : didDoc.getServiceByType("DIDCommMessaging");
    if (typeof service.serviceEndpoint !== "string") {
      throw Error("Only string service endpoints are supported");
    }
    try {
      const resp = await axios.post(service.serviceEndpoint, packedMsg, {
        headers: { "Content-Type": DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED },
      });
      return resp.status === 200 || resp.status === 201;
    } catch (e) {
      console.log(
        `error sending didcomm message to ${service.serviceEndpoint}, received ${e.response}`
      );
      return false;
    }
  }

  async receiveMessage(
    jwe: IJWE,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<boolean> {
    const unpackedMsg = await this.core.unpackMessage(jwe, mediaType);
    return this.handleMessage({ payload: unpackedMsg, repudiable: false });
  }
}

export {
  IDIDCommMessage,
  IDIDCommMessageHandler,
  DIDCOMM_MESSAGE_MEDIA_TYPE,
  IDIDComm,
};
