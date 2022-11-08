import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "$lib/utils.js";

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
      created_time: Date.now() / 1000,
      body: {}
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

  async handle(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<boolean> {
    console.log(
      `Issue Credential - Offer Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
