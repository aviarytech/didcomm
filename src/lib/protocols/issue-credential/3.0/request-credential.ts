import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommAttachment, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";

export const ISSUE_CREDENTIAL_REQUEST_TYPE =
  "https://didcomm.org/issue-credential/3.0/request-credential";

export class IssueCredentialRequestMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    thid?: string;
    to?: string[];
    created_time?: number;
    body: {};
    attachments: IDIDCommAttachment[]
  };
  repudiable = false;

  constructor(
    from: string,
    to: string[],
    thid: string,
  ) {
    const id = sha256(nanoid())
    this.payload = {
      id,
      from,
      type: ISSUE_CREDENTIAL_REQUEST_TYPE,
      thid,
      to,
      created_time: Math.floor(Date.now() / 1000),
      body: {},
      attachments: []
    };
  }
}

export class IssueCredentialRequestMessageHandler implements IDIDCommMessageHandler {
  type = ISSUE_CREDENTIAL_REQUEST_TYPE;
  callback: (msg: IssueCredentialRequestMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (msg: IssueCredentialRequestMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<void> {
    console.log(
      `Issue Credential - Request Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
  }
}
