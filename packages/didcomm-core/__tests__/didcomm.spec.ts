import { DIDCommMessageMediaType } from "didcomm-core/src/interfaces";
import { DIDComm } from "../src/index";

const didDoc = require("../__fixtures__/didDoc.json");
const encryptedMsg = require("../__fixtures__/encryptedMessage.json");

test("didcomm can get service block", () => {
  expect(DIDComm.getDIDCommService(didDoc).type).toBe("DIDCommMessaging");
});

test("didcomm can get key id from message", () => {
  expect(DIDComm.getKeyIdFromMessage(encryptedMsg)).toBe(
    "did:web:aviary.vc#key-1"
  );
});

test("didcomm can create message", async () => {
  const didcomm = new DIDComm();
  const msg = await didcomm.createMessage(didDoc, {
    id: "123",
    to: "did:web:aviary.vc",
    type: "https://didcomm.org/test",
    body: { msg: "test" },
  });

  expect(msg.mediaType).toBe(DIDCommMessageMediaType.ENCRYPTED);
  expect(msg.protected).toBeDefined();
  expect(msg.recipients).toBeDefined();
  expect(msg.iv).toBeDefined();
  expect(msg.ciphertext).toBeDefined();
  expect(msg.tag).toBeDefined();
});

test("didcomm can decrypt message", async () => {
  const privateKey = "97zaVwREYgufMTMk947v7anAKKriPgVQ6kj558A7nqHe";
  const keyId = DIDComm.getKeyIdFromMessage(encryptedMsg);
  const keyBlock = didDoc.verificationMethod.find((v) => v.id === keyId);

  const didcomm = new DIDComm();
  const msg = await didcomm.unpackMessage(
    encryptedMsg.mediaType,
    {
      id: keyBlock.id,
      controller: keyBlock.controller,
      type: keyBlock.type,
      publicKeyBase58: keyBlock.publicKeyBase58,
      privateKeyBase58: privateKey,
    },
    encryptedMsg
  );

  expect(msg.id).toBe("123");
  expect(msg.to).toBe("did:web:aviary.vc");
  expect(msg.type).toBe("https://didcomm.org/test");
  expect(msg.body.msg).toBe("test");
});

test("didcomm can init with handlers", () => {
  const messageHandler = jest.fn((e) => 42 + e.body.x);
  const didcomm = new DIDComm(new Map([["foo-message", messageHandler]]));

  didcomm.handleMessage({
    type: "foo-message",
    id: "1",
    to: "did:example:123",
    body: { x: 0 },
  });

  expect(messageHandler.mock.calls.length).toBe(1);
});
