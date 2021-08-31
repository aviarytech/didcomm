import { IDIDCommMessageHandler } from "@aviarytech/didcomm-messaging";
import { IDIDCommMessage } from "didcomm-messaging/src";

export class TrustPingMessage {
  constructor(private response_requested = true) {}
}

export class DefaultTrustPingMessageHandler implements IDIDCommMessageHandler {
  type: "https://didcomm.org/trust_ping/1.0/ping";

  handle (message: IDIDCommMessage): Promise<boolean> {
    if ()
  }
}
