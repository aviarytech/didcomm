import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "$lib/utils.js";

export const ISSUE_CREDENTIAL_PROPOSE_TYPE =
  "https://didcomm.org/issue-credential/3.0/propose-credential";

export class IssueCredentialProposeMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    thid?: string;
    to?: string[];
    created_time?: string;
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
      created_time: new Date().toISOString(),
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

  async handle(props: {
    message: any,
    didcomm: IDIDComm
  }): Promise<boolean> {
    console.log(
      `Issue Credential - Propose Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
