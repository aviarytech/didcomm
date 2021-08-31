import {
  IDIDComm,
  IDIDCommMessageHandler,
  IDIDCommMessage,
} from "@aviarytech/didcomm-messaging";
import { sha256 } from "../utils/sha256";
import {
  TrustPingResponseMessage,
  TRUST_PING_RESPONSE_TYPE,
} from "./trust-ping-response";

const TYPE = "https://didcomm.org/trust_ping/1.0/ping";

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
  type = TYPE;

  async handle(props: {
    message: TrustPingMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    const { payload } = props.message;
    if (payload.body.response_requested) {
      if (!payload.from) {
        console.error(
          `Error in Trust Ping Protocol: response requested but from not included`
        );
        return false;
      }
      const responseMessage: TrustPingResponseMessage = {
        payload: {
          id: sha256(payload.id),
          thid: payload.id,
          type: TRUST_PING_RESPONSE_TYPE,
        },
        repudiable: false,
      };
      props.didcomm.sendMessage(payload.from, responseMessage);
    }
  }
}
