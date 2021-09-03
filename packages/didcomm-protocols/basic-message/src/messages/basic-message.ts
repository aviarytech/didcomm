import {
  IDIDComm,
  IDIDCommMessage,
  IDIDCommMessageHandler,
} from "@aviarytech/didcomm-messaging";

export const BASIC_MESSAGE_TYPE =
  "https://didcomm.org/basicmessage/1.0/message";

export interface BasicMessageMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    thid: string;
    from: string;
    to?: string[];
    created_time?: string;
    body: {
      content: string;
    };
  };
}

export class BasicMessageMessageHandler implements IDIDCommMessageHandler {
  type = BASIC_MESSAGE_TYPE;

  async handle(props: {
    message: BasicMessageMessage;
    didcomm: IDIDComm;
  }): Promise<boolean> {
    console.log(
      `Message Received: ${props.message.payload.body.content}, sent at ${props.message.payload.created_time}`
    );
    return true;
  }
}
