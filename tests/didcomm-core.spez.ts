import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants";
import { DIDCommCore } from "$lib/core";
import type { IDIDResolver } from "$lib/interfaces";
import { DIDDocument, JSONSecretResolver } from "@aviarytech/dids";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

const didDoc0 = require("./fixtures/didDocs/did0.json");
const didDoc1 = require("./fixtures/didDocs/did1.json");
const key0 = require("./fixtures/keys/key0.json");
const key1 = require("./fixtures/keys/key1.json");
const document = require("./fixtures/document.json");
const jwe0 = require("./fixtures/jwes/jwe0.json");
const jwe1 = require("./fixtures/jwes/jwe1.json");

let didResolver0: IDIDResolver;
let didResolver1: IDIDResolver;

beforeAll(() => {
  didResolver0 = { resolve: vi.fn().mockResolvedValue(new DIDDocument(didDoc0)) }
  didResolver1 = { resolve: vi.fn().mockResolvedValue(new DIDDocument(didDoc1)) }
});

test("didcomm core can pack message with X25519KeyAgreementKey2019 key", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDCommCore(didResolver1, secretResolver);
  const message = await didcomm.packMessage("did:web:example.com", document);

  expect(message.protected).toBeDefined();
  expect(message.iv).toBeDefined();
  expect(message.ciphertext).toBeDefined();
  expect(message.tag).toBeDefined();
  expect(message.recipients?.length).toBe(1);
  expect(message.recipients?.at(0)?.header.kid).toBe(key1.id);
  expect(message.recipients?.at(0)?.header?.epk?.x).toBeDefined();
});

test("didcomm core can pack message with JsonWebKey2020", async () => {
  const secretResolver = new JSONSecretResolver(key0);
  const didcomm = new DIDCommCore(didResolver0, secretResolver);

  const message = await didcomm.packMessage("did:web:example.com", document);

  expect(message.protected).toBeDefined();
  expect(message.recipients).toBeDefined();
  expect(message.iv).toBeDefined();
  expect(message.ciphertext).toBeDefined();
  expect(message.tag).toBeDefined();
  expect(message.recipients?.at(0)?.header.kid).toBe(key0.id);
  expect(message.recipients?.at(0)?.header?.epk?.x).toBeDefined();
});

test("didcomm core can unpack message X25519KeyAgreementKey2019", async () => {
  const secretResolver = new JSONSecretResolver(key1);

  const didcomm = new DIDCommCore(didResolver1, secretResolver);
  const msg = await didcomm.unpackMessage(
    jwe1,
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(msg.id).toBe("123");
  expect(msg.to).toBe("did:web:example.com");
  expect(msg.type).toBe("https://didcomm.org/test");
  expect(msg.body.msg).toBe("test");
});

test("didcomm core can unpack message JsonWebKey2020", async () => {
  const secretResolver = new JSONSecretResolver(key0);

  const didcomm = new DIDCommCore(didResolver0, secretResolver);
  const msg = await didcomm.unpackMessage(
    jwe0,
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(msg.id).toBe("123");
  expect(msg.to).toBe("did:web:example.com");
  expect(msg.type).toBe("https://didcomm.org/test");
  expect(msg.body.msg).toBe("test");
});
