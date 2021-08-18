import { IJWE, IJWS } from "@aviarytech/crypto-core";

interface IDIDCommAttachment {
  id: string;
  description?: string;
  filename?: string;
  mime_type?: string;
  lastmod_time?: string;
  byte_count?: number;
  data: {
    jws?: IJWS;
    hash?: string;
    links?: string[];
    base64?: string;
    json?: object;
  };
}

interface IDIDCommPayload {
  id: string;
  type: string;
  from?: string;
  to: string;
  thid?: string;
  pthid?: string;
  expires_time?: string;
  created_time?: string;
  next?: string;
  from_prior?: string;
  body: any;
  attachments?: IDIDCommAttachment[];
}

interface IDIDCommMessage {
  payload: IDIDCommPayload;
  repudiable: boolean;
  signature?: string;
}

interface IDIDCommMessageHandler {
  type: string;
  handle: (message: IDIDCommMessage) => Promise<boolean>;
}

interface IDIDCommCore {
  handleMessage: (message: IDIDCommMessage) => void;
  createMessage: (msg: IDIDCommPayload) => Promise<IJWE>;
  sendMessage: (did: string, msg: IJWE) => Promise<boolean>;
}

export {
  IDIDCommCore,
  IDIDCommMessage,
  IDIDCommPayload,
  IDIDCommAttachment,
  IDIDCommMessageHandler,
};
