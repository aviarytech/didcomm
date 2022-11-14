import type { IJWE, IJWS, JsonWebKey2020 } from "@aviarytech/crypto";
import type { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants.js";
import type { IDIDDocument } from "@aviarytech/dids";

export interface IDIDCommAttachment {
  id?: string;
  description?: string;
  filename?: string;
  media_type?: string;
  format?: string;
  lastmod_time?: string;
  byte_count?: number;
  data: {
    jws?: IJWS;
    hash?: string;
    links?: string[];
    base64?: string;
    json?: any;
  };
}

export interface IDIDCommPayload {
  id: string;
  type: string;
  from?: string;
  to?: string[];
  thid?: string;
  pthid?: string;
  expires_time?: number;
  created_time?: number;
  next?: string;
  from_prior?: string;
  body: any;
  attachments?: IDIDCommAttachment[];
}

export interface IDIDCommCore {
  packMessage(did: string, payload: IDIDCommPayload): Promise<IJWE>;
  unpackMessage(
    jwe: IJWE,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<IDIDCommPayload>;
}


/**
 * A secret.
 */
export interface ISecret {
  id: string;
  type: string;
  /** The value of the private key in PEM format. Only one value field will be present. */
  privateKeyPem?: string;

  /** The value of the private key in JWK format. Only one value field will be present. */
  privateKeyJwk?: any;

  /** The value of the private key in hex format. Only one value field will be present. */
  privateKeyHex?: string;

  /** The value of the private key in Base64 format. Only one value field will be present. */
  privateKeyBase64?: string;

  /** The value of the private key in Base58 format. Only one value field will be present. */
  privateKeyBase58?: string;

  /** The value of the private key in Multibase format. Only one value field will be present. */
  privateKeyMultibase?: string;

  asJsonWebKey(): Promise<JsonWebKey2020>;
}

export interface IJWK {
	alg?: string;
	crv: string;
	d?: string;
	dp?: string;
	dq?: string;
	e?: string;
	ext?: boolean;
	k?: string;
	key_ops?: string[];
	kid?: string;
	kty: string;
	n?: string;
	oth?: Array<{
		d?: string;
		r?: string;
		t?: string;
	}>;
	p?: string;
	q?: string;
	qi?: string;
	use?: string;
	x?: string;
	y?: string;
	x5c?: string[];
	x5t?: string;
	'x5t#S256'?: string;
	x5u?: string;
	[propName: string]: unknown
}

export interface ISecretResolver {
  resolve(id: string): Promise<ISecret>;
}

export interface IDIDResolver {
  resolve(id: string): Promise<IDIDDocument>;
}

export interface IDIDCommMessage {
  payload: IDIDCommPayload;
  repudiable: boolean;
  signature?: string;
}

export interface IDIDCommMessageHandler {
  type: string;
  handle: (props: { message: IDIDCommMessage, didcomm: IDIDComm}) => Promise<void>;
}

export interface IDIDComm {
  handleMessage(message: IDIDCommMessage): void;
  sendMessage: (did: string, message: IDIDCommMessage) => Promise<boolean>;
  sendPackedMessage: (did: string, jwe: IJWE) => Promise<boolean>;
  receiveMessage(
    jwe: IJWE,
    mediaType: string
  ): Promise<boolean>;
}
