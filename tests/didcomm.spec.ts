import { DIDComm } from "$lib";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants";
import { DIDDocument, JSONSecretResolver } from "@aviarytech/dids";
import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest"
const didDoc0 = require("./fixtures/didDocs/did0.json");
const didDoc1 = require("./fixtures/didDocs/did1.json");
const didDocNoKAK = require("./fixtures/didDocs/did-no-kak.json");
const key0 = require("./fixtures/keys/key0.json");
const key1 = require("./fixtures/keys/key1.json");
const document = require("./fixtures/document.json");
const jwe0 = require("./fixtures/jwes/jwe0.json");
const jwe1 = require("./fixtures/jwes/jwe1.json");

let didResolver: any;

vi.mock('cross-fetch', () => {
  return {
    default: vi
      .fn()
      .mockResolvedValueOnce({ data: "OK", status: 200 })
      .mockResolvedValueOnce({ data: "NOT OK", status: 400 })
  }
})

beforeEach(() => {
  didResolver = { resolve: vi.fn().mockResolvedValue(new DIDDocument(didDoc1)) }
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

test("didcomm can not send message to did with 400", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDComm([], didResolver, secretResolver);

  const res = await didcomm.sendMessage("did:web:example.com", {
    payload: document,
    repudiable: false,
  });

  expect(res).toBeFalsy();
});

test("didcomm can't send message to did w/ no kaks", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockedDoc = new DIDDocument(didDocNoKAK);
  const didcomm = new DIDComm([], { resolve: vi.fn().mockResolvedValue(mockedDoc) }, secretResolver);

  const res = await didcomm.sendMessage("did:web:example.com", {
    payload: document,
    repudiable: false,
  });

  expect(res).toBeFalsy()
});

test.only("didcomm can receive message w/ handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockCallback = vi.fn(async (m) => {});
  const didcomm = new DIDComm(
    [
      {
        type: "https://didcomm.org/test",
        handle: mockCallback,
      }
    ],
    didResolver,
    secretResolver
  );
    console.log(typeof jwe1)
  const result = await didcomm.receiveMessage(
    JSON.stringify(jwe1),
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(result).toBeTruthy();
  expect(mockCallback.mock.calls.length).toBe(1);
});

test("didcomm can receive message w/ handler & wildcard handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockCallback = vi.fn(async (m) => {});
  const otherMockCallback = vi.fn(async (m) => {});
  const didcomm = new DIDComm(
    [
      {
        type: "https://didcomm.org/test",
        handle: mockCallback,
      },
      {
        type: "*",
        handle: otherMockCallback
      }
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
  expect(otherMockCallback.mock.calls.length).toBe(1);
});

test("didcomm can receive message w/o handler", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDComm([], didResolver, secretResolver);

  const result = await didcomm.receiveMessage(
    jwe1,
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(result).toBeTruthy();
});

test("didcomm can receive plaintext message w/ handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockCallback = vi.fn(async (m) => {});
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
