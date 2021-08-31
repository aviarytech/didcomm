# DIDComm Trust Ping

This protocol is core to the [DIDComm v2 specification](https://identity.foundation/didcomm-messaging/spec/#trust-ping-protocol-10) and is a standard way for agents to test connectivity, responsiveness, and security of a DIDComm channel.

There are two parties in a trust ping: the sender and the receiver. The sender initiates the trust ping. The receiver responds. If the receiver wants to do a ping of their own, they can, but this is a new interaction in which they become the sender.

## Messages

1. `ping`

   The trust ping interaction begins when sender creates a ping message like this:

   ```
   {
     "type": "https://didcomm.org/trust_ping/1.0/ping",
     "id": "518be002-de8e-456e-b3d5-8fe472477a86",
     "from": "did:example:123456",
     "body": {
       "response_requested": true
     }
   }
   ```

   response_requested: default value is true. If false, the sender is not requesting a ping_response from the receiver. If true, the sender is requesting a response.

1. `ping_response`

   When the message arrives at the receiver, assuming that response_requested is not false, the receiver should reply as quickly as possible with a ping_response message that looks like this:

   ```
   {
     "type": "https://didcomm.org/trust_ping/1.0/ping_response",
     "id": "e002518b-456e-b3d5-de8e-7a86fe472847",
     "thid": "518be002-de8e-456e-b3d5-8fe472477a86"
   }
   ```
