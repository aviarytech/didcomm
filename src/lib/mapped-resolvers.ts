import { multibase } from "@aviarytech/crypto"
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
          let type = v.type;
          let format = type === 'JsonWebKey2020' ? 'JWK' : type === 'X25519KeyAgreementKey2019' || type === 'Ed25519VerificationKey2018' ? 'Base58' : type === 'X25519KeyAgreementKey2020' || type === 'Ed25519VerificationKey2020' ? 'Multibase' : type;
          let value = format === 'JWK' ? v.publicKeyJwk : format === 'Base58' ? v.publicKeyBase58 : format === 'Multibase' ? v.publicKeyMultibase : null;
          return {
            id: v.id,
            type,
            controller: v.controller,
            verification_material: {
              format,
              value
            }
          }
        }) ?? []
      }
    }
    return null;
  }
})

export class DIDCommSecretResolver {
  constructor(private secretResolver: ISecretResolver) {}

  async get_secret(id: string): Promise<Secret | null> {
    const doc = await this.secretResolver.resolve(id)
    if (doc) {
      let type = doc.type;
      let format = type === 'JsonWebKey2020' ? 'JWK' : type === 'X25519KeyAgreementKey2019' || type === 'Ed25519VerificationKey2018' ? 'Base58' : type === 'X25519KeyAgreementKey2020' || type === 'Ed25519VerificationKey2020' ? 'Multibase' : type;
      let value = format === 'JWK' ? doc.privateKeyJwk : format === 'Base58' ? doc.privateKeyBase58 : format === 'Multibase' ? doc.privateKeyMultibase : null;
      return {
        id: doc.id,
        type,
        secret_material: {
          format,
          value
        }
      }
    }
    return null;
  }

  async find_secrets(ids: string[]): Promise<string[]> {
    let secrets = [];
    for (let i = 0; i < ids.length; i++) {
      const secret = await this.get_secret(ids[i])
      if (secret) {
        secrets.push(secret.id)
      }
    }
    return secrets;
  }
}