import { DIDResolver } from "@aviarytech/did-core";
import { JSONSecretResolver } from "@aviarytech/did-secrets";
import { DIDCommCore } from "../src/index";
import axios from "axios";
import { DIDCommMessageMediaType } from "didcomm-core/src/constants";

const didDoc0 = require("../__fixtures__/didDocs/did0.json");
const didDoc1 = require("../__fixtures__/didDocs/did1.json");
const key0 = require("../__fixtures__/keys/key0.json");
const key1 = require("../__fixtures__/keys/key1.json");
const document = require("../__fixtures__/document.json");
const jwe0 = require("../__fixtures__/jwes/jwe0.json");
const jwe1 = require("../__fixtures__/jwes/jwe1.json");

let didResolver;
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  didResolver = new DIDResolver();
});

afterEach(() => {
  mockedAxios.get.mockReset();
});

test("didcomm can pack message with X25519KeyAgreementKey2019 key", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDCommCore([], didResolver, secretResolver);
  mockedAxios.get.mockResolvedValue({ data: JSON.stringify(didDoc1) });

  const message = await didcomm.packMessage(document);

  expect(message.protected).toBeDefined();
  expect(message.iv).toBeDefined();
  expect(message.ciphertext).toBeDefined();
  expect(message.tag).toBeDefined();
  expect(message.recipients.length).toBe(1);
  expect(message.recipients[0].header.kid).toBe(key1.id);
  expect(message.recipients[0].header.epk.x).toBeDefined();
});

test("didcomm can pack message with JsonWebKey2020", async () => {
  const secretResolver = new JSONSecretResolver(key0);
  const didcomm = new DIDCommCore([], didResolver, secretResolver);
  mockedAxios.get.mockResolvedValue({ data: JSON.stringify(didDoc0) });

  const message = await didcomm.packMessage(document);

  expect(message.protected).toBeDefined();
  expect(message.recipients).toBeDefined();
  expect(message.iv).toBeDefined();
  expect(message.ciphertext).toBeDefined();
  expect(message.tag).toBeDefined();
  expect(message.recipients[0].header.kid).toBe(key0.id);
  expect(message.recipients[0].header.epk.x).toBeDefined();
});

test("didcomm can unpack message X25519KeyAgreementKey2019", async () => {
  const secretResolver = new JSONSecretResolver(key1);

  const didcomm = new DIDCommCore([], didResolver, secretResolver);
  const msg = await didcomm.unpackMessage(
    jwe1,
    DIDCommMessageMediaType.ENCRYPTED
  );

  expect(msg.id).toBe("123");
  expect(msg.to).toBe("did:web:example.com");
  expect(msg.type).toBe("https://didcomm.org/test");
  expect(msg.body.msg).toBe("test");
});

test("didcomm can unpack message JsonWebKey2020", async () => {
  const secretResolver = new JSONSecretResolver(key0);

  const didcomm = new DIDCommCore([], didResolver, secretResolver);
  const msg = await didcomm.unpackMessage(
    jwe0,
    DIDCommMessageMediaType.ENCRYPTED
  );

  expect(msg.id).toBe("123");
  expect(msg.to).toBe("did:web:example.com");
  expect(msg.type).toBe("https://didcomm.org/test");
  expect(msg.body.msg).toBe("test");
});

test("didcomm can send message to did", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDCommCore([], didResolver, secretResolver);
  mockedAxios.get.mockResolvedValue({ data: JSON.stringify(didDoc1) });
  mockedAxios.post.mockResolvedValue({ data: "OK", status: 200 });

  const res = await didcomm.sendMessage("did:web:example.com", jwe1);

  expect(res).toBeTruthy();
});