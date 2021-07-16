import { DIDCommMessageMediaType } from "didcomm-core/src/interfaces";
import { DIDComm } from "../src/index";
import { X25519KeyPair } from "@transmute/x25519-key-pair";

const didDoc = require("../__fixtures__/didDoc.json");
const encryptedMsg = require("../__fixtures__/encryptedMessage.json");

test("didcomm can get service block", () => {
  expect(DIDComm.getDIDCommService(didDoc).type).toBe("DIDCommMessaging");
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
  const keyId = encryptedMsg.recipients[0].header.kid;
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
