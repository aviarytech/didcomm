import { sha256, sha256pow } from "@aviarytech/crypto-core";
import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "@aviarytech/didcomm-messaging";

export const BASIC_MESSAGE_TYPE =
  "https://didcomm.org/basicmessage/1.0/message";
export class BasicMessage implements IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from: string;
    thid: string;
    to?: string[];
    created_time?: string;
    body: {
      content: string;
    };
  };
  repudiable = false;

  constructor(from: string, to: string[], content: string, thid?: string) {
    const id = sha256pow(
      from,
      sha256(BASIC_MESSAGE_TYPE).slice(0, 4),
      content
    )[0];
    this.payload = {
      id,
      from,
      type: BASIC_MESSAGE_TYPE,
      thid: thid ?? id,
      to,
      created_time: new Date().toISOString(),
      body: {
        content,
      },
    };
  }
}

export class BasicMessageHandler implements IDIDCommMessageHandler {
  type = BASIC_MESSAGE_TYPE;
  callback: (msg: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (payload: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: BasicMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    await this.callback(props.message, props.didcomm);
    console.log(
      `Basic Message Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    return true;
  }
}
