import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "@aviarytech/crypto";

export const ISSUE_CREDENTIAL_ACK_TYPE =
  "https://didcomm.org/issue-credential/3.0/ack";

export class IssueCredentialAckMessage implements IDIDCommMessage {
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
      type: ISSUE_CREDENTIAL_ACK_TYPE,
      thid,
      to,
      created_time: Math.floor(Date.now() / 1000),
      body: {}
    };
  }
}

export class IssueCredentialAckMessageHandler implements IDIDCommMessageHandler {
  type = ISSUE_CREDENTIAL_ACK_TYPE;
  callback: (msg: IssueCredentialAckMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (msg: IssueCredentialAckMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async sendingHook(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<void> {
    props.didcomm.threads.removeThread(props.message.payload.thid)
  }

  async handle(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<void> {
    console.log(
      `Issue Credential - Ack Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    props.didcomm.threads.removeThread(props.message.payload.thid)
  }
}
