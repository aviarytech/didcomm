import { IDIDDocumentVerificationMethod } from "@aviarytech/did-core";
import {
  X25519KeyAgreementKey2019,
  X25519KeyPair,
} from "@transmute/x25519-key-pair";
import { JWK, parseJwk } from "jose/jwk/parse";
import { FlattenedEncrypt } from "jose/jwe/flattened/encrypt";
import {
  IDIDCommEncryptedMessage,
  IDIDCommPlaintextPayload,
  JsonWebKey2020,
} from "../interfaces";

const JWE_ALG = "ECDH-ES";
const JWE_ENC = "A256GCM";

const encrypt = async (message: string, publicKeyJwk: JWK): Promise<string> => {
  const publicKey = await parseJwk(publicKeyJwk, JWE_ALG);
  const encoder = new TextEncoder();
  const encryptedMessage = await new FlattenedEncrypt(encoder.encode(message))
    .setProtectedHeader({ alg: JWE_ALG, enc: JWE_ENC })
    .encrypt(publicKey);

  return JSON.stringify(encryptedMessage);
};

export const encryptMessage = async (
  message: IDIDCommPlaintextPayload,
  key: IDIDDocumentVerificationMethod
): Promise<IDIDCommEncryptedMessage> => {
  const { type } = key;
  const recipients = [
    {
      header: {
        kid: key.id,
        alg: "ECDH-ES+A256KW",
      },
    },
  ];
  if (type === "JsonWebKey2020") {
    const encrypted = JSON.parse(
      await encrypt(JSON.stringify(message), key.publicKeyJwk)
    );
    return { recipients, ...encrypted };
  }
  if (type === "X25519KeyAgreementKey2019") {
    const keyPair = await X25519KeyPair.from(key as X25519KeyAgreementKey2019);
    const jwk = (await keyPair.export({
      privateKey: false,
      type: "JsonWebKey2020",
    })) as JsonWebKey2020;
    const encrypted = JSON.parse(
      await encrypt(JSON.stringify(message), jwk.publicKeyJwk)
    );
    return { recipients, ...encrypted };
  }
  throw new Error(`Key type: ${type} not supported`);
};
