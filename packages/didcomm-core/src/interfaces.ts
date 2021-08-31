import { IJWE, IJWS } from "@aviarytech/crypto-core";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "./constants";

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
  to?: string[];
  thid?: string;
  pthid?: string;
  expires_time?: string;
  created_time?: string;
  next?: string;
  from_prior?: string;
  body?: any;
  attachments?: IDIDCommAttachment[];
}

interface IDIDCommCore {
  packMessage(did: string, payload: IDIDCommPayload): Promise<IJWE>;
  unpackMessage(
    jwe: IJWE,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<IDIDCommPayload>;
}

export { IDIDCommCore, IDIDCommPayload, IDIDCommAttachment };
