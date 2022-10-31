import {
  IDIDComm,
  IDIDCommMessageHandler,
  IDIDCommMessage,
} from "@aviarytech/didcomm-messaging";
import { sha256 } from "../../../utils";
import {
  TrustPingResponseMessage,
  TRUST_PING_RESPONSE_PING_TYPE,
} from "./trust-ping-response";

export const TRUST_PING_PING_TYPE = "https://didcomm.org/trust_ping/1.0/ping";

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
        },
        repudiable: false,
      };
      return await props.didcomm.sendMessage(payload.from, responseMessage);
    }
    return true;
  }
}
