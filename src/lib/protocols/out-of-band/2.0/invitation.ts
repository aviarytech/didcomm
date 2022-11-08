import { base64url } from "@aviarytech/crypto"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "$lib/utils.js";

export const INVITATION_MESSAGE_TYPE =
  "https://didcomm.org/out-of-band/2.0/invitation";

export class InvitationMessage implements IDIDCommMessage {
  url: string;
  payload: {
    id: string;
    type: string;
    from: string;
    created_time?: number;
    body: {
      goal_code?: string;
      goal?: string;
      accept: string[];
    };
  };
  repudiable = false;

  constructor(
    from: string,
    basePath: string,
    goal_code?: string,
    goal?: string
  ) {
    const created = Date.now() / 1000;
    this.payload = {
      id: sha256(from + INVITATION_MESSAGE_TYPE + created),
      type: INVITATION_MESSAGE_TYPE,
      created_time: created,
      from,
      body: {
        accept: ["didcomm/v2"],
      },
    };
    if (goal_code) {
      this.payload.body.goal_code = goal_code;
    }
    if (goal) {
      this.payload.body.goal = goal;
    }

    const payload = JSON.stringify(this.payload);
    this.url = basePath + "?_oob=" + base64url.encode(payload);
  }
}

export class InvitationMessageHandler implements IDIDCommMessageHandler {
  type = INVITATION_MESSAGE_TYPE;
  callback: (msg: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (payload: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: IDIDCommMessage,
    didcomm: IDIDComm
  }): Promise<boolean> {
    console.log(
      `Out of Band Invitation Message Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
