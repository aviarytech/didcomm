import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";
import { TRUST_PING_RESPONSE_PING_TYPE, type TrustPingResponseMessage } from "$lib/protocols/trust-ping/2.0/ping-response.js";


export const TRUST_PING_PING_TYPE = "https://didcomm.org/trust-ping/2.0/ping";

export interface TrustPingMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    created_time?: number;
    from?: string;
    to?: string[];
    body: {
      response_requested: boolean;
    };
  };
}

export class DefaultTrustPingMessageHandler implements IDIDCommMessageHandler {
  type = TRUST_PING_PING_TYPE;

  async sendingHook(props: {
    message: TrustPingMessage;
    didcomm: IDIDComm;
  }): Promise<void> {
    if(props.message.payload.to?.length && props.message.payload.body.response_requested) {
      props.didcomm.threads.addThread(props.message.payload.id, props.message.payload.to[0])
    }
  }

  async handle(props: {
    message: TrustPingMessage;
    didcomm: IDIDComm;
  }): Promise<void> {
    const { payload } = props.message;
    if (payload.body.response_requested) {
      if (!payload.from) {
        console.error(
          `Error in Trust Ping Protocol: response requested but "from" property not included`
        );
      }
      const responseMessage: TrustPingResponseMessage = {
        payload: {
          id: sha256(payload.id),
          thid: payload.id,
          created_time: Math.floor(Date.now() / 1000),
          type: TRUST_PING_RESPONSE_PING_TYPE,
          body: {}
        },
        repudiable: false,
      };
      if (!payload.from) {
        console.error(`No 'from' did found to to send trust ping response to`)
      } else {
        await props.didcomm.sendMessage(payload.from, responseMessage);
      }
    }
  }
}
