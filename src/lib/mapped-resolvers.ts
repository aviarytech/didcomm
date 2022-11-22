import type { IDIDResolver, ISecretResolver } from "@aviarytech/dids"
import type { DIDDoc, Secret } from "didcomm-node"

export const DIDCommDIDResolver = (didResolver: IDIDResolver) => ({
  resolve: async (did: string): Promise<DIDDoc | null> => {
    const doc = await didResolver.resolve(did)
    if (doc) {
      return {
        did: doc.id,
        key_agreements: doc.keyAgreement?.map(k => typeof k === 'string' ? k : k.id) ?? [],
        authentications: doc.authentication?.map(k => typeof k === 'string' ? k :k.id) ?? [],
        services: doc.service?.map(s => ({id: typeof s === 'string' ? s : s.id, kind: {DIDCommMessaging: {
          service_endpoint: typeof s === 'string' ? s : s.serviceEndpoint,
          routing_keys: typeof s === 'string' ? [] : s.routingKeys
        }}})) ?? [],
        verification_methods: doc.verificationMethod?.map(v => {
          let format = v.type === 'JsonWebKey2020' ? 'JWK' : v.type === 'X25519KeyAgreementKey2019' || v.type === 'Ed25519VerificationKey2018' ? 'Base58' : v.type === 'X25519KeyAgreementKey2020' || v.type === 'Ed25519VerificationKey2020' ? 'Multibase' : v.type;
          let value = format === 'JWK' ? v.publicKeyJwk : format === 'Base58' ? v.publicKeyBase58 : format === 'Multibase' ? v.publicKeyMultibase : null;
          return {
          id: v.id,
          type: v.type,
          controller: v.controller,
          verification_material: {
            format,
            value
          }
        }}) ?? []
      }
    }
    return null;
  }
})

export const DIDCommSecretResolver = (secretResolver: ISecretResolver) => {
  async function get_secret(id: string): Promise<Secret | null> {
    const doc = await secretResolver.resolve(id)
    if (doc) {
      let format = doc.type === 'JsonWebKey2020' ? 'JWK' : doc.type === 'X25519KeyAgreementKey2019' || doc.type === 'Ed25519VerificationKey2018' ? 'Base58' : doc.type === 'X25519KeyAgreementKey2020' || doc.type === 'Ed25519VerificationKey2020' ? 'Multibase' : doc.type;
      let value = format === 'JWK' ? doc.privateKeyJwk : format === 'Base58' ? doc.privateKeyBase58 : format === 'Multibase' ? doc.privateKeyMultibase : null;
      return {
        id: doc.id,
        type: doc.type,
        secret_material: {
          format,
          value
        }
      }
    }
    return null;
  }

  async function find_secrets(ids: string[]): Promise<string[]> {
    let secrets = [];
    for (let i = 0; i < ids.length; i++) {
      const secret = await get_secret(ids[i])
      if (secret) {
        secrets.push(secret.secret_material.value)
      }
    }
    return secrets;
  }
  return {
    get_secret,
    find_secrets
  }
}