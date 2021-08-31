import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "@aviarytech/didcomm-messaging";

export const TRUST_PING_RESPONSE_TYPE =
  "https://didcomm.org/trust_ping/1.0/ping_response";

export interface TrustPingResponseMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    thid: string;
    from?: string;
    to?: string[];
  };
}

export class DefaultTrustPingResponseMessageHandler
  implements IDIDCommMessageHandler {
  type = TRUST_PING_RESPONSE_TYPE;

  async handle(props: {
    message: TrustPingResponseMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    return true;
  }
}
