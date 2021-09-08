# Present Proof DIDComm Protocol

This is version 3 of the present-proof protocol that has been created initially for the WACI-PEX work.

## Messages

1. Propose Presentation

```
{
    "type": "https://didcomm.org/present-proof/3.0/propose-presentation",
    "id": "95e63a5f-73e1-46ac-b269-48bb22591bfa",
    "pthid": "599f3638-b563-4937-9487-dfe55099d900",
    "from": "did:example:prover",
    "to": "did:example:verifier"
}
```

1. Request Presentation

```
{
  "type": "https://didcomm.org/present-proof/3.0/request-presentation",
  "id": "0ac534c8-98ed-4fe3-8a41-3600775e1e92",
  "thid": "95e63a5f-73e1-46ac-b269-48bb22591bfa",
  "from": "did:example:prover",
  "to": ["did:example:verifier"],
  "body": {},
  "attachments": [
    <Presentation Exchange Definition>
  ]
}
```
