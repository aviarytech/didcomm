import { DIDResolver } from "@aviarytech/did-core";
import { JSONSecretResolver } from "@aviarytech/did-secrets";
import axios from "axios";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "@aviarytech/didcomm-core";
import { DIDComm } from "../src";

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

test("didcomm can send message to did", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const didcomm = new DIDComm([], didResolver, secretResolver);
  mockedAxios.get.mockResolvedValue({ data: JSON.stringify(didDoc1) });
  mockedAxios.post.mockResolvedValue({ data: "OK", status: 200 });

  const res = await didcomm.sendMessage("did:web:example.com", {
    payload: document,
    repudiable: false,
  });

  expect(res).toBeTruthy();
});

test("didcomm can receive message w/ handler (success)", async () => {
  const secretResolver = new JSONSecretResolver(key1);
  const mockCallback = jest.fn(async (m) => true);
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
  const mockCallback = jest.fn(async (m) => true);
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
    { type: "https://didcomm.org/test", id: "123" },
    DIDCOMM_MESSAGE_MEDIA_TYPE.PLAIN
  );

  expect(result).toBeTruthy();
  expect(mockCallback.mock.calls.length).toBe(1);
});
