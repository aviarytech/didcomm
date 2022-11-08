import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";
import { TRUST_PING_RESPONSE_PING_TYPE, type TrustPingResponseMessage } from "$lib/protocols/trust-ping/2.0/ping-response.js";


export const TRUST_PING_PING_TYPE = "https://didcomm.org/trust-ping/2.0/ping";

export interface TrustPingMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    to?: string[];
    body: {
      response_requested: boolean;
    };
  };
}

export class DefaultTrustPingMessageHandler implements IDIDCommMessageHandler {
  type = TRUST_PING_PING_TYPE;

  async handle(props: {
    message: TrustPingMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    const { payload } = props.message;
    if (payload.body.response_requested) {
      if (!payload.from) {
        console.error(
          `Error in Trust Ping Protocol: response requested but "from" property not included`
        );
        return false;
      }
      const responseMessage: TrustPingResponseMessage = {
        payload: {
          id: sha256(payload.id),
          thid: payload.id,
          type: TRUST_PING_RESPONSE_PING_TYPE,
          body: {}
        },
        repudiable: false,
      };
      return await props.didcomm.sendMessage(payload.from, responseMessage);
    }
    return true;
  }
}
