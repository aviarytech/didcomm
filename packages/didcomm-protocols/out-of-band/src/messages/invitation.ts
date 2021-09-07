import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "@aviarytech/didcomm-messaging";
import { base64url, sha256 } from "@aviarytech/crypto-core";

export const INVITATION_MESSAGE_TYPE =
  "https://didcomm.org/out-of-band/2.0/invitation";

export class InvitationMessage implements IDIDCommMessage {
  url: string;
  payload: {
    id: string;
    type: string;
    from: string;
    created_time?: string;
    body: {
      goal_code?: string;
      goal?: string;
      accept: string[];
    };
  };
  repudiable: boolean;

  constructor(
    private from: string,
    private basePath: string,
    private goal_code?: string,
    private goal?: string
  ) {
    const created = new Date().toISOString();
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

  async handle(props: {
    message: InvitationMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    console.log(
      `Out of Band Invitation Message Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    return true;
  }
}
