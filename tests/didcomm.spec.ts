import { DIDComm } from "$lib";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants";
import { DIDDocument, JSONSecretResolver } from "@aviarytech/dids";
import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest"
const aliceDidDoc = require("./fixtures/didDocs/alice.json");
const bobDidDoc = require("./fixtures/didDocs/bob.json");
const didDocNoKAK = require("./fixtures/didDocs/did-no-kak.json");
const alice = require("./fixtures/keys/alice.json");
const bob = require("./fixtures/keys/bob.json");
const document = require("./fixtures/document.json");
const jwe0 = require("./fixtures/jwes/jwe0.json");

const mockDidResolver = {
  resolve: async (id: string) => id === 'did:example:alice' ? new DIDDocument(aliceDidDoc) : new DIDDocument(bobDidDoc)
}

vi.mock('cross-fetch', () => {
  return {
    default: vi
      .fn()
      .mockResolvedValueOnce({ data: "OK", status: 200 })
      .mockResolvedValueOnce({ data: "NOT OK", status: 400 })
  }
})

test("didcomm can send message to did", async () => {
  const secretResolver = new JSONSecretResolver(alice);
  const didcomm = new DIDComm([], mockDidResolver, secretResolver, "http://example.com");
  const spy = vi.spyOn(didcomm, 'sendPackedMessage')

  const res = await didcomm.sendMessage("did:example:bob", {
    payload: document,
    repudiable: false,
  });

  expect(res).toBeTruthy();
  expect(spy).toHaveBeenCalled()
});

// test.only("didcomm can not send message to did with 400", async () => {
//   const secretResolver = new JSONSecretResolver(key1);
//   const didcomm = new DIDComm([], didResolver, secretResolver, 'http://example.com');
//   const spy = vi.spyOn(didcomm, 'sendPackedMessage')

//   const res = await didcomm.sendMessage("did:example:bob", {
//     payload: document,
//     repudiable: false,
//   });

//   expect(spy).toHaveBeenCalled()
//   expect(res).toBeFalsy();
// });

test("didcomm can't send message to did w/ no kaks", async () => {
  const secretResolver = new JSONSecretResolver(alice);
  const mockedDoc = new DIDDocument(didDocNoKAK);
  const didcomm = new DIDComm([], { resolve: vi.fn().mockResolvedValue(mockedDoc) }, secretResolver, 'http://example.com');

  const res = await didcomm.sendMessage("did:web:example.com", {
    payload: document,
    repudiable: false,
  });

  expect(res).toBeFalsy()
});

test.only("didcomm can receive message w/ handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(bob);
  const spy = vi.spyOn(secretResolver, 'resolve')
  const mockCallback = vi.fn(async (m) => {});
  const didcomm = new DIDComm(
    [
      {
        type: "https://didcomm.org/test",
        handle: mockCallback,
      }
    ],
    mockDidResolver,
    secretResolver,
    'http://example.com'
  );
  const result = await didcomm.receiveMessage(
    JSON.stringify(jwe0),
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );
  
  expect(spy).toHaveBeenCalledWith('did:example:bob#key-1')
  expect(mockCallback.mock.calls.length).toBe(1);
  expect(result).toBeTruthy();
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
    secretResolver,
    'http://example.com'
  );

  const result = await didcomm.receiveMessage(
    jwe2,
    DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED
  );

  expect(result).toBeTruthy();
  expect(mockCallback.mock.calls.length).toBe(1);
  expect(otherMockCallback.mock.calls.length).toBe(1);
});

test("didcomm can receive message w/o handler", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDComm([], didResolver, secretResolver, 'http://example.com');

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
    secretResolver,
    'http://example.com'
  );

  const result = await didcomm.receiveMessage(
    { type: "https://didcomm.org/test", id: "123", body: {} },
    DIDCOMM_MESSAGE_MEDIA_TYPE.PLAIN
  );

  expect(result).toBeTruthy();
  expect(mockCallback.mock.calls.length).toBe(1);
});
