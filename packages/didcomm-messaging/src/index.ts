import axios from "axios";
import { IDIDResolver } from "@aviarytech/did-core";
import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "./interfaces";
import { EventBus } from "./utils/event-bus";
import { IJWE } from "@aviarytech/crypto-core";
import { ISecretResolver } from "@aviarytech/did-secrets";
import {
  DIDCommCore,
  IDIDCommCore,
  DIDCOMM_MESSAGE_MEDIA_TYPE,
  IDIDCommPayload,
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
      this.messageBus.register(handler.type, handler);
    });
  }

  handleMessage(message: IDIDCommMessage): boolean {
    if (this.messageHandlers.find((h) => h.type === message.payload.type)) {
      this.messageBus.dispatch(message.payload.type, {
        message,
        didcomm: this,
      });
      return true;
    }
    return false;
  }

  async sendMessage(
    did: string,
    message: IDIDCommMessage,
    serviceId?: string
  ): Promise<boolean> {
    const packedMsg = await this.core.packMessage(did, message.payload);
    const didDoc = await this.didResolver.resolve(did);

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
        `error sending didcomm message to ${service.serviceEndpoint}, received ${e.response.statusCode} - ${e.response.message}`
      );
      return false;
    }
  }

  async receiveMessage(
    msg: IJWE | IDIDCommPayload,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<boolean> {
    let finalMessage: IDIDCommPayload;
    if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED) {
      finalMessage = await this.core.unpackMessage(msg as IJWE, mediaType);
    } else if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.PLAIN) {
      finalMessage = msg as IDIDCommPayload;
    } else {
      throw new Error(`Unsupported Media Type: ${mediaType}`);
    }
    console.log(`DIDComm received ${finalMessage.type} message`);
    return this.handleMessage({ payload: finalMessage, repudiable: false });
  }
}

export {
  IDIDCommMessage,
  IDIDCommMessageHandler,
  DIDCOMM_MESSAGE_MEDIA_TYPE,
  IDIDComm,
};
