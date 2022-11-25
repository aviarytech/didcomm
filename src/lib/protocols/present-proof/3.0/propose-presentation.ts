import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";

export const PROPOSE_PRESENTATION_TYPE =
  "https://didcomm.org/present-proof/3.0/propose-presentation";

export class ProposePresentationMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from: string;
    pthid: string;
    to: string[];
    created_time?: number;
    body: {};
  };
  repudiable = false;

  constructor(from: string, to: string[], pthid: string) {
    const id = sha256(nanoid());
    this.payload = {
      id,
      from,
      type: PROPOSE_PRESENTATION_TYPE,
      pthid,
      to,
      created_time: Math.floor(Date.now() / 1000),
      body: {},
    };
  }
}

export class ProposePresentationMessageHandler
  implements IDIDCommMessageHandler {
  type = PROPOSE_PRESENTATION_TYPE;
  callback: (msg: ProposePresentationMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (msg: ProposePresentationMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: any;
    didcomm: IDIDComm;
  }): Promise<void> {
    console.log(
      `Propose Presentation Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
  }
}
