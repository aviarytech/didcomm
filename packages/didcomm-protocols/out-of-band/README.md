# DIDComm Out of Band Protocol

This is a core protocol in the (DIDComm v2 Specification)[https://identity.foundation/didcomm-messaging/spec/#out-of-band-messages]

## Messages

1. `Invitation`

```
{
  "id": "123456780",
  "type": "https://didcomm.org/out-of-band/2.0/invitation",
  "from": "did:example:123",
  "created_time": "2019-01-15 18:42:01Z",
  "body": {
    "goal_code": "issue-vc",
    "goal": "To issue a Faber College Graduate credential",
    "accept": [
      "didcomm/v2"
    ]
  }
}
```
