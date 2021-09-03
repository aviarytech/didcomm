# DIDComm Basic Message

This protocol is adapted from the DIDComm v1 version from [Aries RFC 0095](https://github.com/hyperledger/aries-rfcs/tree/main/features/0095-basic-message)

The BasicMessage protocol describes a stateless, easy to support user message protocol. It has a single message type used to communicate.

## Messages

1. `Basic Message`

```
{
  "id": "123456780",
  "type": "https://didcomm.org/basicmessage/1.0/message",
  "from": "did:example:123",
  "to": ["did:example:456"],
  "created_time": "2019-01-15 18:42:01Z",
  "body": {
    "content": "Your hovercraft is full of eels."
  }
}
```
