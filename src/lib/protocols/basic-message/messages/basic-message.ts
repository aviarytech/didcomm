import { nanoid } from "nanoid"
import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";
import { sha256 } from "$lib/utils.js";

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
    const id = sha256(nanoid());
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

  async handle(props: { message: IDIDCommMessage, didcomm: IDIDComm}): Promise<boolean> {
    console.log(
      `Basic Message Received: ${props.message.payload.id}, sent at ${props.message.payload.created_time}`
    );
    await this.callback(props.message, props.didcomm);
    return true;
  }
}
