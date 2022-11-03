import axios from "axios"
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants.js";
import { DIDCommCore } from "$lib/core.js";
import { EventBus } from "$lib/event-bus.js";
import type { IDIDComm, IDIDCommCore, IDIDCommMessage, IDIDCommMessageHandler, IDIDCommPayload, IDIDResolver, ISecretResolver } from "$lib/interfaces.js";
import type { IJWE } from "@aviarytech/crypto";
import type { IDIDDocument, IDIDDocumentServiceDescriptor } from "@aviarytech/dids";

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
    let didDoc: IDIDDocument;
    let packedMsg: IJWE;
    let service: IDIDDocumentServiceDescriptor | undefined;
    try {
      packedMsg = await this.core.packMessage(did, message.payload);
      didDoc = await this.didResolver.resolve(did);
  
    } catch (e: any) {
      console.error(`Failed to resolve did ${did}:`, e.message)
      return false;
    }
    try {
      service = serviceId
        ? didDoc.getServiceById(serviceId)
        : didDoc.getServiceByType("DIDCommMessaging");
      if (typeof service?.serviceEndpoint !== "string") {
        throw Error("Only string service endpoints are supported");
      }
      const resp = await axios.post(service.serviceEndpoint, packedMsg, {
        headers: { "Content-Type": DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED },
      });
      return resp.status.toString().at(0) === '2';
    } catch (e: any) {
      if (e.response.statusCode) console.error(`error sending didcomm message to ${service?.serviceEndpoint}, received ${e.response.statusCode} - ${e.response.message}`);
      else console.error(`error sending didcomm message to ${service?.serviceEndpoint}\n`, `response data:`, e.response.data)
      return false;
    }
  }

  async receiveMessage(
    msg: IJWE | IDIDCommPayload,
    mediaType: string
  ): Promise<boolean> {
    let finalMessage: IDIDCommPayload;
    try {
      if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED) {
        finalMessage = await this.core.unpackMessage(msg as IJWE, mediaType);
      } else if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.PLAIN) {
        finalMessage = msg as IDIDCommPayload;
      } else {
        throw new Error(`Unsupported Media Type: ${mediaType}`);
      }
      console.log(`DIDComm received ${finalMessage.type} message`);
      return this.handleMessage({ payload: finalMessage, repudiable: false });
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }
}