import type { IDIDComm, IDIDCommPayload, IDIDCommAttachment, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";


export const ROUTING_FORWARD_MESSAGE_TYPE = "https://didcomm.org/routing/2.0/forward";

export interface RoutingForwardMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    to?: string[];
    created_time?: number;
    expires_time?: number;
    body: {
      next: string;
    };
    attachments?: IDIDCommAttachment[]
  };
}

export class RoutingForwardMessageHandler implements IDIDCommMessageHandler {
  type = ROUTING_FORWARD_MESSAGE_TYPE;
  callback: (msg: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (payload: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: RoutingForwardMessage;
    didcomm: IDIDComm;
  }): Promise<void> {
    const { message, didcomm } = props;
    const { payload } = message;
    console.log(
      `Forward Message Received: ${payload.id}, sent at ${payload.created_time}`
    );
    if (!payload.attachments) {
      console.error(`Forward Message missing attachments`)
    } else {
      for (let i = 0; i < payload.attachments.length; i++) {
        const msg = payload.attachments.at(i)?.data.json
        if (msg) {
          await didcomm.sendMessage(payload.body.next, {payload: msg as IDIDCommPayload, repudiable: false})
          await this.callback(payload.attachments.at(i)?.data.json as any, didcomm)
        } else {
          console.error(`Forward message attachment didn't include 'json' field`)
        }
      }
    }
  }
}
