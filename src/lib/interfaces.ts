import type { IJWE, IJWS, JsonWebKey2020 } from "@aviarytech/crypto";
import type { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants";

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
    json?: object;
  };
}

export interface IDIDCommPayload {
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

/**
 * A verification method definition entry in a DID Document.
 */
 export interface IDIDDocumentVerificationMethod {
/** Fully qualified identifier of this public key, e.g. did:example:123#key-1 */
id: string;

/** The type of this public key, as defined in: https://w3c-ccg.github.io/ld-cryptosuite-registry/ */
type: string;

/** The DID of the controller of this key. */
controller: string;

/** The value of the public key in PEM format. Only one value field will be present. */
publicKeyPem?: string;

/** The value of the public key in JWK format. Only one value field will be present. */
publicKeyJwk?: IJWK;

/** The value of the public key in hex format. Only one value field will be present. */
publicKeyHex?: string;

/** The value of the public key in Base64 format. Only one value field will be present. */
publicKeyBase64?: string;

/** The value of the public key in Base58 format. Only one value field will be present. */
publicKeyBase58?: string;

/** The value of the public key in Multibase format. Only one value field will be present. */
publicKeyMultibase?: string;
}

export interface IDIDDocumentServiceEndpoint {
/** uri of the service endpoint */
uri?: string;

/** array of media types in order of preference for sending a message to the endpoint */
accept?: string[];

/** ordered array of keys to be used for preparing the message for transmission */
routingKeys?: string[];
}

/**
 * Defines a service descriptor entry present in a DID Document.
 */
export interface IDIDDocumentServiceDescriptor {
/** id of this service, e.g. `did:example:123#id`. */
id: string;

/** The type of this service. */
type: string;

/** The endpoint of this service, as a URI. */
serviceEndpoint: string | IDIDDocumentServiceEndpoint | IDIDDocumentServiceEndpoint[];
}

/**
 * Decentralized Identity Document.
 */
export interface IDIDDocument {
/** The JSON-LD context of the DID Documents. */
"@context": string[] | string;

/** The DID to which this DID Document pertains. */
id: string;

/** The controller of the DID */
controller?: string;

/** This DID is also known as */
alsoKnownAs?: string;

/** Array of verification methods associated with the DID. */
verificationMethod?: IDIDDocumentVerificationMethod[];

/** Array of services associated with the DID. */
service?: IDIDDocumentServiceDescriptor[] | string[];

/** Array of authentication methods. */
authentication?: IDIDDocumentVerificationMethod[] | string[];

/** Array of assertion methods. */
assertionMethod?: IDIDDocumentVerificationMethod[] | string[];

/** Array of key agreement methods */
keyAgreement?: IDIDDocumentVerificationMethod[] | string[];

/** Array of capability invocation methods */
capabilityInvocation?: IDIDDocumentVerificationMethod[] | string[];

/** Array of capability delegation methods */
capabilityDelegation?: IDIDDocumentVerificationMethod[] | string[];


normalizeVerificationMethod: (
  methods: (string | IDIDDocumentVerificationMethod)[]
) => IDIDDocumentVerificationMethod[];
getVerificationMethodById: (id: string) => IDIDDocumentVerificationMethod;
getServiceById: (id: string) => IDIDDocumentServiceDescriptor;
getServiceByType: (type: string) => IDIDDocumentServiceDescriptor;
getKeyAgreementById: (id: string) => IDIDDocumentVerificationMethod;
getAllKeyAgreements: () => IDIDDocumentVerificationMethod[];
getAuthenticationById: (id: string) => IDIDDocumentVerificationMethod;
getCapabilityInvocationById: (id: string) => IDIDDocumentVerificationMethod;
getCapabilityDelegationById: (id: string) => IDIDDocumentVerificationMethod;
getAssertionMethodById: (id: string) => IDIDDocumentVerificationMethod;
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
  handle: (props: { message: IDIDCommMessage, didcomm: IDIDComm}) => Promise<boolean>;
}

export interface IDIDComm {
  handleMessage(message: IDIDCommMessage): boolean;
  sendMessage: (did: string, message: IDIDCommMessage) => Promise<boolean>;
  receiveMessage(
    jwe: IJWE,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<boolean>;
}
