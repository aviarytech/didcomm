import { sha256, sha256pow } from "@aviarytech/crypto-core";
import { IDIDCommAttachment } from "@aviarytech/didcomm-core";
import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "@aviarytech/didcomm-messaging";

export const PRESENTATION_TYPE =
  "https://didcomm.org/present-proof/3.0/presentation";

export class PresentationMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from: string;
    thid: string;
    to: string[];
    created_time?: string;
    body: {};
    attachments: IDIDCommAttachment[];
  };
  repudiable = false;

  constructor(
    from: string,
    to: string[],
    thid: string,
    attachments: IDIDCommAttachment[]
  ) {
    const id = sha256pow(from, sha256(PRESENTATION_TYPE).slice(0, 4), "")[0]
      .rotation;
    this.payload = {
      id,
      from,
      type: PRESENTATION_TYPE,
      thid,
      to,
      created_time: new Date().toISOString(),
      body: {},
      attachments,
    };
  }
}

export class PresentationMessageHandler implements IDIDCommMessageHandler {
  type = PRESENTATION_TYPE;
  callback: (msg: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (payload: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: PresentationMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    console.log(
      `Presentation Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
