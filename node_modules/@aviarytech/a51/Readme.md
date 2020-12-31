# a51

This library generates cryptographic keypairs based on specified requirements that are quite beautiful.

## target

the target is the leading characters in the vanity key/hash

## key gen methods

- genEd25519 => Generates an Ed25519 keypair
- genBls12381 => Generates a Bls12381 G2 keypair
- random => Generates a random value not suitable as a keypair

## work methods

- didSov => Creates a vanity did:sov
- didKey => Creates a vanity did:key
- sha256Hash => Creates a vanity hash of the public key
- noWork => Always returns true - used for regular key generation

### Example

```
const keyPair = await genKey("AV1", genEd25519, didSov);
```
