import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";


export const SHORTENED_URL_INVALIDATE_TYPE = "https://didcomm.org/shorten-url/1.0/invalidate-url";

export interface ShortenedURLInvalidateMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    to?: string[];
    created_time?: number;
    expires_time?: number;
    body: {
      shortened_url: string;
    };
  };
}

export const createShortenedURLInvalidateMessage = (msg: ShortenedURLInvalidateMessage) => msg;

export class ShortenedURLInvalidateMessageHandler implements IDIDCommMessageHandler {
  type = SHORTENED_URL_INVALIDATE_TYPE;
  callback: (message: ShortenedURLInvalidateMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (message: ShortenedURLInvalidateMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: ShortenedURLInvalidateMessage;
    didcomm: IDIDComm;
  }): Promise<void> {
    const { message, didcomm } = props;
    const { payload } = message;
    console.log(
      `Invalidate Shortened URL Received: ${payload.id}, sent at ${payload.created_time}`
    );

    await this.callback(message, didcomm)
  }
}
