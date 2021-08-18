// import { JWK } from "@aviarytech/crypto-core";
// import {
//   DIDDocument,
//   IDIDDocumentVerificationMethod,
// } from "@aviarytech/did-core";
// import { JWE as JWECipher } from "@transmute/jose-ld";
// import {
//   X25519KeyAgreementKey2019,
//   X25519KeyPair,
// } from "@transmute/x25519-key-pair";
// import { IDIDCommMessage, IDIDCommPayload } from "./interfaces";

// const JWE_ALG = "ECDH-ES";
// const JWE_ENC = "A256GCM";

// const encrypt = async (
//   payload: IDIDCommPayload,
//   to: DIDDocument
// ): Promise<IDIDCommMessage> => {
//   const kaks = to.getAllKeyAgreements();
//   const ciphers = kaks.map((k) => {
//     return new JWECipher.Cipher(k.asJwk())
//   })
//   // TODO determine proper alg
//   const recipients = kaks.map((k) => {
//     return {
//       header: {
//         kid: k.id,
//         alg: "ECDH-ES+A256KW",
//       },
//     };
//   });

//   const messages = ciphers.map((cipher) => {

//   })

//   const encryptedMessage = await new FlattenedEncrypt(encoder.encode(payload))
//     .setProtectedHeader({ alg: JWE_ALG, enc: JWE_ENC })
//     .encrypt(publicKey);

//   return JSON.stringify(encryptedMessage);
// };

// export const encryptMessage = async (
//   message: IDIDCommPlaintextPayload,
//   key: IDIDDocumentVerificationMethod
// ): Promise<IDIDCommEncryptedMessage> => {
//   const { type } = key;
//   const recipients = [
//     {
//       header: {
//         kid: key.id,
//         alg: "ECDH-ES+A256KW",
//       },
//     },
//   ];
//   if (type === "JsonWebKey2020") {
//     const encrypted = JSON.parse(
//       await encrypt(JSON.stringify(message), key.publicKeyJwk)
//     );
//     return { recipients, ...encrypted };
//   }
//   if (type === "X25519KeyAgreementKey2019") {
//     const keyPair = await X25519KeyPair.from(key as X25519KeyAgreementKey2019);
//     const jwk = (await keyPair.export({
//       privateKey: false,
//       type: "JsonWebKey2020",
//     })) as JsonWebKey2020;
//     const encrypted = JSON.parse(
//       await encrypt(JSON.stringify(message), jwk.publicKeyJwk)
//     );
//     return { recipients, ...encrypted };
//   }
//   throw new Error(`Key type: ${type} not supported`);
// };
