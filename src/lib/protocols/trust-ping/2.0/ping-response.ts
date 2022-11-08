import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";

export const TRUST_PING_RESPONSE_PING_TYPE =
  "https://didcomm.org/trust-ping/2.0/ping-response";

export interface TrustPingResponseMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    thid: string;
    from?: string;
    to?: string[];
    body: any;
  };
}

export class DefaultTrustPingResponseMessageHandler
  implements IDIDCommMessageHandler {
  type = TRUST_PING_RESPONSE_PING_TYPE;

  async handle(props: {
    message: IDIDCommMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    return true;
  }
}
