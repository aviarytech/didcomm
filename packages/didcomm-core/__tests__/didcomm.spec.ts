import { DIDResolver } from "@aviarytech/did-core";
import { JSONSecretResolver } from "@aviarytech/did-secrets";
import { DIDCommCore } from "../src/index";
import axios from "axios";

const didDoc = require("../__fixtures__/didDoc.json");
const key0 = require("../__fixtures__/keys/key0.json");
const key1 = require("../__fixtures__/keys/key1.json");
const encryptedMsg = require("../__fixtures__/encryptedMessage.json");
const encryptedMsgJwk = require("../__fixtures__/encryptedMessageJwk.json");

let didResolver;
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  didResolver = new DIDResolver();
});

afterEach(() => {
  mockedAxios.get.mockReset();
});

test("didcomm can create message with X25519KeyAgreementKey2019 key", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDCommCore([], didResolver, secretResolver);
  mockedAxios.get.mockResolvedValue({ data: JSON.stringify(didDoc) });

  const message = await didcomm.createMessage("did:web:example.com", {
    id: "123",
    to: "did:web:aviary.vc",
    type: "https://didcomm.org/test",
    body: { msg: "test" },
  });

  expect(message.protected).toBeDefined();
  expect(message.iv).toBeDefined();
  expect(message.ciphertext).toBeDefined();
  expect(message.tag).toBeDefined();
  expect(message.recipients.length).toBe(1);
  expect(message.recipients[0].header.kid).toBe(key1.id);
  expect(message.recipients[0].header.epk.x).toBeDefined();
});

// test("didcomm can create message with jwk", async () => {
//   // TODO this needs to be x25519 it's currently ed25519 but transmute lib doesn't support x..
//   const secretResolver = new JSONSecretResolver(key0);
//   const didcomm = new DIDCommCore([], didResolver, secretResolver);
//   const messages = await didcomm.createMessage("did:web:example.com", {
//     id: "123",
//     to: "did:web:example.com",
//     type: "https://didcomm.org/test",
//     body: { msg: "test" },
//   });

//   expect(messages.length).toBe(1);
//   expect(messages[0].protected).toBeDefined();
//   expect(messages[0].recipients).toBeDefined();
//   expect(messages[0].iv).toBeDefined();
//   expect(messages[0].ciphertext).toBeDefined();
//   expect(messages[0].tag).toBeDefined();
// });

// test("didcomm can decrypt message x25519", async () => {
//   const privateKey = "97zaVwREYgufMTMk947v7anAKKriPgVQ6kj558A7nqHe";
//   const keyId = DIDCommCore.getKeyIdFromMessage(encryptedMsg);
//   const keyBlock = didDoc.verificationMethod.find((v) => v.id === keyId);

//   const didcomm = new DIDCommCore();
//   const msg = await didcomm.unpackMessage(
//     encryptedMsg.mediaType,
//     {
//       id: keyBlock.id,
//       controller: keyBlock.controller,
//       type: keyBlock.type,
//       publicKeyBase58: keyBlock.publicKeyBase58,
//       privateKeyBase58: privateKey,
//     },
//     encryptedMsg
//   );

//   expect(msg.id).toBe("123");
//   expect(msg.to).toBe("did:web:aviary.vc");
//   expect(msg.type).toBe("https://didcomm.org/test");
//   expect(msg.body.msg).toBe("test");
// });

// test("didcomm can decrypt message jwk", async () => {
//   const privateKeyJwk = {
//     kty: "OKP",
//     crv: "X25519",
//     x: "dlqZoqdhRZJ2OMzB4XYDtpVnbbdS2jPofl_FaFV5xyY",
//     d: "u_S2GbtN9AvpItgsQHGrLo9bHf7MxYS_1rHPdPB_3j4",
//   };
//   const keyId = DIDCommCore.getKeyIdFromMessage(encryptedMsgJwk);
//   const keyBlock = didDoc.verificationMethod.find((v) => v.id === keyId);

//   const didcomm = new DIDCommCore();
//   const msg = await didcomm.unpackMessage(
//     encryptedMsgJwk.mediaType,
//     {
//       id: keyBlock.id,
//       controller: keyBlock.controller,
//       type: keyBlock.type,
//       publicKeyJwk: keyBlock.publicKeyJwk,
//       privateKeyJwk: privateKeyJwk,
//     },
//     encryptedMsgJwk
//   );

//   expect(msg.id).toBe("123");
//   expect(msg.to).toBe("did:web:aviary.vc");
//   expect(msg.type).toBe("https://didcomm.org/test");
//   expect(msg.body.msg).toBe("test");
// });

// test("didcomm can init with handlers", () => {
//   const messageHandler = jest.fn((e) => 42 + e.body.x);
//   const didcomm = new DIDCommCore(new Map([["foo-message", messageHandler]]));

//   didcomm.handleMessage({
//     type: "foo-message",
//     id: "1",
//     to: "did:example:123",
//     body: { x: 0 },
//   });

//   expect(messageHandler.mock.calls.length).toBe(1);
// });
