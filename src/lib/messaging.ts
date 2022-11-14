import fetch from 'cross-fetch';
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants.js";
import { DIDCommCore } from "$lib/core.js";
import { EventBus } from "$lib/event-bus.js";
import type { IDIDComm, IDIDCommCore, IDIDCommMessage, IDIDCommMessageHandler, IDIDCommPayload, IDIDResolver, ISecretResolver } from "$lib/interfaces.js";
import { sha256, type IJWE } from "@aviarytech/crypto";
import type { IDIDDocument, IDIDDocumentServiceDescriptor } from "@aviarytech/dids";
import { createRoutingForwardMessage, ROUTING_FORWARD_MESSAGE_TYPE } from '$lib/protocols/routing/2.0/forward.js';
import { nanoid } from 'nanoid';

export class DIDComm implements IDIDComm {
  private messageBus: EventBus;
  private core: IDIDCommCore;
  private myURL: string;

  constructor(
    private messageHandlers: IDIDCommMessageHandler[],
    private didResolver: IDIDResolver,
    private secretResolver: ISecretResolver,
    private myURL: string
  ) {
    this.myURL = myURL
    this.core = new DIDCommCore(didResolver, secretResolver);
    this.messageBus = new EventBus();
    messageHandlers.forEach((handler) => {
      this.messageBus.register(handler.type, handler);
    });
  }

  handleMessage(message: IDIDCommMessage): void {
    if (this.messageHandlers.find((h) => h.type === message.payload.type)) {
      this.messageBus.dispatch(message.payload.type, {
        message,
        didcomm: this,
      });
    }
    if (this.messageHandlers.find((h) => h.type === "*")) {
      this.messageBus.dispatch("*", {
        message,
        didcomm: this
      })
    }
  }

  async sendPackedMessage(did: string, jwe: IJWE, serviceId?: string, from?: string): Promise<boolean> {
    let didDoc: IDIDDocument;
    let service: IDIDDocumentServiceDescriptor | undefined;
    try {
      didDoc = await this.didResolver.resolve(did);
    } catch (e: any) {
      console.error(`Failed to resolve did ${did}:`, e.message)
      return false;
    }
    try {
      service = serviceId
        ? didDoc.getServiceById(serviceId)
        : didDoc.getServiceByType("DIDCommMessaging");
      if (!service)
        throw new Error(`service not found in ${did}`)
      if (typeof service?.serviceEndpoint !== "string") 
        throw new Error("Only string service endpoints are supported");
      const routingKeys = service.routingKeys ?? []
      for (let i = routingKeys.length - 1; i >= 0; i--) {
        const next = i === routingKeys.length - 1 ? did : routingKeys[i+1]
        const id = sha256(nanoid());
        const fwd = createRoutingForwardMessage({
          payload: {
            id,
            type: ROUTING_FORWARD_MESSAGE_TYPE,
            from,
            to: [routingKeys[i]],
            created_time: Math.floor(Date.now() / 1000),
            body: {
              next
            },
            attachments: [{data: { json: jwe }}]
          },
          repudiable: false
        })
        jwe = await this.core.packMessage(routingKeys[i], fwd.payload);
      }
      if (service.serviceEndpoint === this.myURL) {
        console.log(`Not sending didcomm message to self`)
        return true;
      }
      const resp = await fetch(service.serviceEndpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
        },
        body: JSON.stringify(jwe)
      });
      if(resp.status.toString().at(0) === '2') {
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.response) console.error(`error sending didcomm message to ${service?.serviceEndpoint}, received ${e.response.statusCode} - ${e.response.message}`);
      else console.error(`error sending didcomm message to ${service?.serviceEndpoint}\n`, `response data:`, e.message)
      return false;
    }
  }

  async sendMessage(
    did: string,
    message: IDIDCommMessage,
    serviceId?: string
  ): Promise<boolean> {
    try {
      const from = message.payload.from
      const packedMsg = await this.core.packMessage(did, message.payload);
      return await this.sendPackedMessage(did, packedMsg, serviceId, from)
    } catch (e: any) {
      console.error(e.message)
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
      this.handleMessage({ payload: finalMessage, repudiable: false });
      return true;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }
}