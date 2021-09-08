import { sha256, sha256pow } from "@aviarytech/crypto-core";
import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "@aviarytech/didcomm-messaging";

export const PROPOSE_PRESENTATION_TYPE =
  "https://didcomm.org/present-proof/3.0/propose-presentation";

export class ProposePresentationMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from: string;
    pthid: string;
    to: string[];
    created_time?: string;
    body: {};
  };
  repudiable = false;

  constructor(from: string, to: string[], pthid: string) {
    const id = sha256pow(
      from,
      sha256(PROPOSE_PRESENTATION_TYPE).slice(0, 4),
      ""
    )[0].rotation;
    this.payload = {
      id,
      from,
      type: PROPOSE_PRESENTATION_TYPE,
      pthid,
      to,
      created_time: new Date().toISOString(),
      body: {},
    };
  }
}

export class ProposePresentationMessageHandler
  implements IDIDCommMessageHandler {
  type = PROPOSE_PRESENTATION_TYPE;
  callback: (msg: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (payload: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: ProposePresentationMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    console.log(
      `Propose Presentation Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
