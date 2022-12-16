import type { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler } from "$lib/interfaces.js";


export const SHORTENED_URL_REQUEST_TYPE = "https://didcomm.org/shorten-url/1.0/request-shortened-url";

export interface RequestShortenedURLMessage extends IDIDCommMessage {
  payload: {
    id: string;
    type: string;
    from?: string;
    to?: string[];
    created_time?: number;
    expires_time?: number;
    body: {
      url: string;
      requested_validity_seconds: number;
      goal_code: string;
      short_url_slug?: string;
    };
  };
}

export const createRequestShortenedURLMessage = (msg: RequestShortenedURLMessage) => msg;

export class RequestShortenedURLMessageHandler implements IDIDCommMessageHandler {
  type = SHORTENED_URL_REQUEST_TYPE;
  callback: (message: RequestShortenedURLMessage, didcomm: IDIDComm) => Promise<void>;

  constructor(
    callback: (message: RequestShortenedURLMessage, didcomm: IDIDComm) => Promise<void>
  ) {
    this.callback = callback;
  }

  async sendingHook(props: {
    message: RequestShortenedURLMessage,
    didcomm: IDIDComm
  }): Promise<void> {
    if(props.message.payload.to?.length) {
      props.didcomm.threads.addThread(props.message.payload.id, props.message.payload.to[0])
    }
  }

  async handle(props: {
    message: RequestShortenedURLMessage;
    didcomm: IDIDComm;
  }): Promise<void> {
    const { message, didcomm } = props;
    const { payload } = message;
    console.log(
      `Request Shortened URL Received: ${payload.id}, sent at ${payload.created_time}`
    );

    await this.callback(message, didcomm)
  }
}
