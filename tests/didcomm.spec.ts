import { DIDComm } from "$lib";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants";
import { DIDDocument, JSONSecretResolver } from "@aviarytech/dids";
import { afterEach, beforeAll, expect, test, vi } from "vitest"
const didDoc0 = require("./fixtures/didDocs/did0.json");
const didDoc1 = require("./fixtures/didDocs/did1.json");
const key0 = require("./fixtures/keys/key0.json");
const key1 = require("./fixtures/keys/key1.json");
const document = require("./fixtures/document.json");
const jwe0 = require("./fixtures/jwes/jwe0.json");
const jwe1 = require("./fixtures/jwes/jwe1.json");

let didResolver: any;
vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn().mockResolvedValue({ data: "OK", status: 200 })
    }
  }
})

beforeAll(() => {
  didResolver = { resolve: vi.fn().mockResolvedValue(new DIDDocument(didDoc1)) }
});

afterEach(() => {
  vi.resetAllMocks()
});

test("didcomm can send message to did", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDComm([], didResolver, secretResolver);

  const res = await didcomm.sendMessage("did:web:example.com", {
    payload: document,
    repudiable: false,
  });

  expect(res).toBeTruthy();
});

test("didcomm can receive message w/ handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockCallback = vi.fn(async (m) => true);
  const didcomm = new DIDComm(
    [
      {
        type: "https://didcomm.org/test",
        handle: mockCallback,
      },
    ],
    didResolver,
    secretResolver
  );

  const result = await didcomm.receiveMessage(
    jwe1,
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(result).toBeTruthy();
  expect(mockCallback.mock.calls.length).toBe(1);
});

test("didcomm can't receive message w/o handler (fail)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDComm([], didResolver, secretResolver);

  const result = await didcomm.receiveMessage(
    jwe1,
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(result).toBeFalsy();
});

test("didcomm can receive plaintext message w/ handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockCallback = vi.fn(async (m) => true);
  const didcomm = new DIDComm(
    [
      {
        type: "https://didcomm.org/test",
        handle: mockCallback,
      },
    ],
    didResolver,
    secretResolver
  );

  const result = await didcomm.receiveMessage(
    { type: "https://didcomm.org/test", id: "123", body: {} },
    DIDCOMM_MESSAGE_MEDIA_TYPE.PLAIN
  );

  expect(result).toBeTruthy();
  expect(mockCallback.mock.calls.length).toBe(1);
});
