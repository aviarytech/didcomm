import fetch from 'cross-fetch';
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants.js";
import { EventBus } from "$lib/event-bus.js";
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler, IDIDCommPayload, IDIDResolver, ISecretResolver } from "$lib/interfaces.js";
import type { DIDDoc, DIDResolver, SecretsResolver, Service } from 'didcomm-node';
import { DIDCommDIDResolver, DIDCommSecretResolver } from '$lib/mapped-resolvers.js';
import { DIDCommThreads } from './threads.js';

export class DIDComm implements IDIDComm {
  public threads: DIDCommThreads;
  private messageBus: EventBus;
  private sendingHooksBus: EventBus;
  private myURL: string;
  private didResolver: DIDResolver;
  private secretResolver: SecretsResolver;
  private messagesReceived: string[];
  private messagesSent: string[];

  constructor(
    private messageHandlers: IDIDCommMessageHandler[],
    _didResolver: IDIDResolver,
    _secretResolver: ISecretResolver,
    _myURL: string
  ) {
    this.threads = new DIDCommThreads();
    this.myURL = _myURL;
    this.didResolver = DIDCommDIDResolver(_didResolver);
    this.secretResolver = new DIDCommSecretResolver(_secretResolver);
    this.messageBus = new EventBus();
    this.sendingHooksBus = new EventBus();
    this.messagesReceived = [];
    this.messagesSent = [];
    messageHandlers.forEach((handler) => {
      this.messageBus.register(handler.type, handler);
      if (handler.sendingHook) {
        this.sendingHooksBus.register(handler.type, { handle: handler.sendingHook })
      }
    });
  }

  handleMessage(message: IDIDCommMessage): void {
    if (this.messageHandlers.find((h) => h.type === "*")) {
      // Always handle wildcard handlers
      this.messageBus.dispatch("*", {
        message,
        didcomm: this
      })
    }
    if (this.messageHandlers.find((h) => h.type === message.payload.type)) {
      if (!this.messagesReceived.includes(message.payload.id)) {
        this.messagesReceived = [message.payload.id, ...this.messagesReceived];
        this.messageBus.dispatch(message.payload.type, {
          message,
          didcomm: this,
        });
      } else {
        console.error(`attempted to handle duplicate message: ${message.payload.id}`)
      }
    }
  }

  async sendPackedMessage(did: string, jwe: string, serviceId?: string): Promise<boolean> {
    let didDoc: DIDDoc | null;
    let service: Service | undefined;
    let serviceEndpoint: string;
    try {
      didDoc = await this.didResolver.resolve(did);
    } catch (e: any) {
      console.error(`Failed to resolve did ${did}:`, e.message)
      return false;
    }
    try {
      service = serviceId
        ? didDoc?.services.find(s => s.id === serviceId)
        : didDoc?.services && didDoc.services.length > 0 ? didDoc?.services[0] : undefined
      serviceEndpoint = (service?.kind as any).DIDCommMessaging.service_endpoint
      if (!serviceEndpoint) 
        throw new Error("service endpoint not found");
      if (serviceEndpoint === this.myURL) {
        console.log('Not sending didcomm message to my own endpoint')
        return true;
      }
      const resp = await fetch(serviceEndpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
        },
        body: jwe
      });
      if(resp.status.toString().at(0) === '2') {
        return true;
      }
      console.error(`Failed to send message to ${serviceEndpoint}, status: ${resp.status}`)
      console.error(resp.statusText)
      return false;
    } catch (e: any) {
      console.error(e.message)
      return false;
    }
  }

  async sendMessage(
    did: string,
    message: IDIDCommMessage,
    serviceId?: string
  ): Promise<boolean> {
    try {
      this.messagesSent = [message.payload.id, ...this.messagesSent];
      if (this.messageHandlers.find((h) => h.type === message.payload.type)) {
        this.sendingHooksBus.dispatch(message.payload.type, {
          message,
          didcomm: this,
        });
      }
      const encryptedMsg = await this.packMessage(did, message)
      return await this.sendPackedMessage(did, encryptedMsg, serviceId)
    } catch (e: any) {
      console.error(e.message)
      return false;
    }
  }

  async packMessage(
    did: string,
    message: IDIDCommMessage
  ): Promise<string> {
    let didcomm = typeof self === 'undefined' ? await import('didcomm-node') : await import('didcomm')
    const msg = new didcomm.Message({
      typ: 'application/didcomm-plain+json',
      ...message.payload
    });

    const [encryptedMsg, encryptMetadata] = await msg.pack_encrypted(
      did,
      null,
      null,
      this.didResolver,
      this.secretResolver,
      {
        forward: true
      }
    );
    return encryptedMsg
  }

  async receiveMessage(
    msg: string,
    mediaType: string
  ): Promise<boolean> {
    let didcomm = typeof self === 'undefined' ? await import('didcomm-node') : await import('didcomm')
    let finalMessage: IDIDCommPayload;
    msg = typeof msg === 'object' ? JSON.stringify(msg) : msg;
    try {
      if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED) {
        const [unpackedMsg, unpackMetadata] = await didcomm.Message.unpack(msg, this.didResolver, this.secretResolver, {})
        finalMessage = unpackedMsg.as_value()
      } else if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.PLAIN) {
        finalMessage = JSON.parse(msg);
      } else {
        throw new Error(`Unsupported Media Type: ${mediaType}`);
      }
      console.log(`DIDComm received ${finalMessage.type} message`);
      this.handleMessage({ payload: finalMessage, repudiable: false });
      return true;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }
}