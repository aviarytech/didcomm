import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";

export const ISSUE_CREDENTIAL_PROPOSE_TYPE =
  "https://didcomm.org/issue-credential/3.0/propose-credential";

export class IssueCredentialProposeMessage implements IDIDCommMessage {
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
      type: ISSUE_CREDENTIAL_PROPOSE_TYPE,
      thid,
      to,
      created_time: Math.floor(Date.now() / 1000),
      body: {}
    };
  }
}

export class IssueCredentialProposeMessageHandler implements IDIDCommMessageHandler {
  type = ISSUE_CREDENTIAL_PROPOSE_TYPE;
  callback: (msg: IssueCredentialProposeMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (msg: IssueCredentialProposeMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async sendingHook(props: { message: IDIDCommMessage; didcomm: IDIDComm; }) {
    const { payload } = props.message;
    if(!payload.thid && payload.from) {
      props.didcomm.threads.addThread(payload.id, payload.from)
    }
  }

  async handle(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<void> {
    console.log(
      `Issue Credential - Propose Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
  }
}
