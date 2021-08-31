// import { JWK, parseJwk } from "jose/jwk/parse";
// import { flattenedDecrypt } from "jose/jwe/flattened/decrypt";

// import {
//   X25519KeyAgreementKey2019,
//   X25519KeyPair,
// } from "@transmute/x25519-key-pair";
// import { JWE } from "@aviarytech/crypto-core";

// const JWE_ALG = "ECDH-ES+A256KW";

// const decrypt = async (
//   message: JWE,
//   privateKeyJwk: JWK
// ): Promise<string> => {
//   const privateKey = await parseJwk(privateKeyJwk, JWE_ALG);
//   const { plaintext } = await flattenedDecrypt(message, privateKey);
//   return Buffer.from(plaintext).toString();
// };

// export const decryptMessage = async (
//   message: IDIDCommEncryptedMessage,
//   key: JsonWebKey2020 | X25519KeyAgreementKey2019
// ): Promise<IDIDCommPlaintextPayload> => {
//   const { type } = key;
//   if (type === "JsonWebKey2020") {
//     const jwk = (key as JsonWebKey2020).privateKeyJwk;
//     const decrypted = await decrypt(message, jwk);
//     return JSON.parse(decrypted) as IDIDCommPlaintextPayload;
//   }
//   if (type === "X25519KeyAgreementKey2019") {
//     const keyPair = await X25519KeyPair.from(key as X25519KeyAgreementKey2019);
//     const jwk = (await keyPair.export({
//       privateKey: true,
//       type: "JsonWebKey2020",
//     })) as JsonWebKey2020;
//     return JSON.parse(
//       await decrypt(message, jwk.privateKeyJwk)
//     ) as IDIDCommPlaintextPayload;
//   }
//   throw new Error(`Key type: ${type} not supported`);
// };
