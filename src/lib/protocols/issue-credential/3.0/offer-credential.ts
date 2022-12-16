import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";
import type { Attachment } from "didcomm-node";

export const ISSUE_CREDENTIAL_OFFER_TYPE =
  "https://didcomm.org/issue-credential/3.0/offer-credential";

export class IssueCredentialOfferMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    thid?: string;
    to?: string[];
    created_time?: number;
    body: {};
    attachments: Attachment[]
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
      type: ISSUE_CREDENTIAL_OFFER_TYPE,
      thid,
      to,
      created_time: Math.floor(Date.now() / 1000),
      body: {},
      attachments: []
    };
  }
}

export class IssueCredentialOfferMessageHandler implements IDIDCommMessageHandler {
  type = ISSUE_CREDENTIAL_OFFER_TYPE;
  callback: (msg: IssueCredentialOfferMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (msg: IssueCredentialOfferMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async sendingHook(props: { message: IDIDCommMessage; didcomm: IDIDComm; }) {
    if(!props.message.payload.thid && props.message.payload.to?.length) {
      props.didcomm.threads.addThread(props.message.payload.id, props.message.payload.to[0])
    }
  }

  async handle(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<void> {
    console.log(
      `Issue Credential - Offer Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
  }
}
