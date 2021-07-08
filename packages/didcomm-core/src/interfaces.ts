import { JWE } from "did-jwt";

export const enum DIDCommMessageMediaType {
  PLAIN = "application/didcomm-plain+json",
  SIGNED = "application/didcomm-signed+json",
  ENCRYPTED = "application/didcomm-encrypted+json",
}

export interface JWS {
  header: {
    typ: string;
    alg: string;
    kid: string;
  };
  payload: string;
  signature: string;
  protected?: string;
}

export interface IBaseDIDCommMessage {
  mediaType: string;
}

export interface IDIDCommAttachment {
  id: string;
  description?: string;
  filename?: string;
  mime_type?: string;
  lastmod_time?: string;
  byte_count?: number;
  data: {
    jws?: JWS;
    hash?: string;
    links?: string[];
    base64?: string;
    jwe?: JWE;
    json?: object;
  };
}

export interface IDIDCommEncryptedMessage extends IBaseDIDCommMessage {
  ciphertext: string;
  iv: string;
  tag: string;
  encrypted_key: string;
  aad: string;
  protected: string;
}

export interface IDIDCommPlaintextPayload {
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

export interface IDIDCommPlaintextMessage extends IBaseDIDCommMessage {
  header?: {
    typ: string;
    kid?: string;
    alg?: string;
  };
  payload?: IDIDCommPlaintextPayload;
  signature?: string;
  data?: string;
}

export interface IDIDCommSignedMessage extends IBaseDIDCommMessage {
  header: {
    typ: string;
    cty: string;
  };
  payload: any;
  signature: string;
}
