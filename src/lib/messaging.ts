import fetch from 'cross-fetch';
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants.js";
import { EventBus } from "$lib/event-bus.js";
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler, IDIDCommPayload, IDIDResolver, ISecretResolver } from "$lib/interfaces.js";
import type { DIDDoc, DIDResolver, PackEncryptedMetadata, SecretsResolver, Service } from 'didcomm-node';
import { DIDCommDIDResolver, DIDCommSecretResolver } from '$lib/mapped-resolvers.js';

export class DIDComm implements IDIDComm {
  private messageBus: EventBus;
  private myURL: string;
  private didResolver: DIDResolver;
  private secretResolver: SecretsResolver;

  constructor(
    private messageHandlers: IDIDCommMessageHandler[],
    _didResolver: IDIDResolver,
    _secretResolver: ISecretResolver,
    _myURL: string
  ) {
    this.myURL = _myURL
    this.didResolver = DIDCommDIDResolver(_didResolver);
    this.secretResolver = new DIDCommSecretResolver(_secretResolver);
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

  async sendPackedMessage(did: string, jwe: string, metadata: PackEncryptedMetadata, serviceId?: string): Promise<boolean> {
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
      // if (!service)
      serviceEndpoint = (service?.kind as any).DIDCommMessaging.service_endpoint
      // const routingKeys = (service?.kind as any).DIDCommMessaging.routingKeys ?? []
      // for (let i = routingKeys.length - 1; i >= 0; i--) {
      //     const next = i === routingKeys.length - 1 ? did : routingKeys[i+1]
      //     if (next.startsWith('did:peer:')) {
      //       // TODO configure and look up did:peer endpoints
      //       return true;
      //     }

      //       // const id = sha256(nanoid());
      //       // const fwd = createRoutingForwardMessage({
      //       //     payload: {
      //       //         id,
      //       //         type: ROUTING_FORWARD_MESSAGE_TYPE,
      //       //         from,
      //       //         to: [routingKeys[i]],
      //       //         created_time: Math.floor(Date.now() / 1000),
      //       //         body: {
      //       //             next
      //       //           },
      //       //           attachments: [{data: { json: jwe }}]
      //       //         },
      //       //         repudiable: false
      //       //       })
      //       //       jwe = await this.core.packMessage(routingKeys[i], fwd.payload);
      //       //     }
      //           // throw new Error(`service not found in ${did}`)
      // }
      if (!serviceEndpoint) 
        throw new Error("service endpoint not found");
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
      return false;
    } catch (e: any) {
      if (e.response) console.error(`error sending didcomm message to ${metadata.messaging_service?.service_endpoint}, received ${e.response.statusCode} - ${e.response.message}`);
      else console.error(`error sending didcomm message to ${metadata.messaging_service?.service_endpoint}\n`, `response data:`, e.message)
      return false;
    }
  }

  async sendMessage(
    did: string,
    message: IDIDCommMessage,
    serviceId?: string
  ): Promise<boolean> {
    try {
      let didcomm = typeof self === 'undefined' ? await import('didcomm-node') : await import('didcomm')
      // Not currently using from (only doing anoncrypt)
      const from = message.payload.from
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
      return await this.sendPackedMessage(did, encryptedMsg, encryptMetadata, serviceId)
    } catch (e: any) {
      console.error(e.message)
      return false;
    }
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