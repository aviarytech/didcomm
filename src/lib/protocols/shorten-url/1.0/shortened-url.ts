import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";


export const SHORTENED_URL_TYPE = "https://didcomm.org/shorten-url/1.0/shortened-url";

export interface ShortenedURLMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    to?: string[];
    created_time?: number;
    expires_time?: number;
    body: {
      shortened_url: string;
      expires_time?: number;
    };
  };
}

export const createShortenedURLMessage = (msg: ShortenedURLMessage) => msg;

export class ShortenedURLMessageHandler implements IDIDCommMessageHandler {
  type = SHORTENED_URL_TYPE;
  callback: (msg: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (payload: IDIDCommMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async handle(props: {
    message: ShortenedURLMessage;
    didcomm: IDIDComm;
  }): Promise<void> {
    const { message, didcomm } = props;
    const { payload } = message;
    console.log(
      `Shortened URL Received: ${payload.id}, sent at ${payload.created_time}`
    );

    await this.callback(message, didcomm)
  }
}
