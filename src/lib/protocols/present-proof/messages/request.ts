import { nanoid } from "nanoid";
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces";
import { sha256 } from "$lib/utils";
import type { IDIFPresentationExchangeDefinitionAttachment } from "../interfaces";

export const REQUEST_PRESENTATION_TYPE =
  "https://didcomm.org/present-proof/3.0/request-presentation";

export class RequestPresentationMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from: string;
    thid: string;
    to: string[];
    created_time?: string;
    body: {};
    attachments: IDIFPresentationExchangeDefinitionAttachment[];
  };
  repudiable = false;

  constructor(
    from: string,
    to: string[],
    thid: string,
    attachments: IDIFPresentationExchangeDefinitionAttachment[]
  ) {
    const id = sha256(nanoid());
    this.payload = {
      id,
      from,
      type: REQUEST_PRESENTATION_TYPE,
      thid,
      to,
      created_time: new Date().toISOString(),
      body: {},
      attachments,
    };
  }
}

export class RequestPresentationMessageHandler
  implements IDIDCommMessageHandler {
  type = REQUEST_PRESENTATION_TYPE;
  callback: (
    msg: RequestPresentationMessage,
    didcomm: IDIDComm
  ) => Promise<void>;

  constructor(
    callback: (
      msg: RequestPresentationMessage,
      didcomm: IDIDComm
    ) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: any;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    console.log(
      `Request Presentation Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
