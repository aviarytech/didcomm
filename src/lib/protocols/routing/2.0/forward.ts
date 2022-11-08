import type { IDIDComm, IDIDCommAttachment, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";
import { TRUST_PING_RESPONSE_PING_TYPE, type TrustPingResponseMessage } from "$lib/protocols/trust-ping/2.0/ping-response.js";


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
  }): Promise<boolean> {
    const { message, didcomm } = props;
    const { payload } = message;
    console.log(
      `Forward Message Received: ${payload.id}, sent at ${payload.created_time}`
    );
    if (!payload.attachments) {
      console.error(`Forward Message missing attachments`)
    } else {
      for (let i = 0; i < payload.attachments.length; i++) {
        if (payload.attachments.at(i)?.data.json) {
          await this.callback(payload.attachments.at(i)?.data.json as any, didcomm)
        } else {
          console.error(`Forward message attachment didn't include 'json' field`)
        }
      }
    }
    return true;
  }
}
