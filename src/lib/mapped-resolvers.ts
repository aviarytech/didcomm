import type { IDIDResolver, ISecretResolver } from "@aviarytech/dids"
import type { DIDDoc, Secret } from "didcomm-node"

export const DIDCommDIDResolver = (didResolver: IDIDResolver) => ({
  resolve: async (did: string): Promise<DIDDoc | null> => {
    const doc = await didResolver.resolve(did)
    if (doc) {
      const newDoc = {
        id: doc.id,
        keyAgreement: doc.keyAgreement?.map(k => typeof k === 'string' ? k : k.id) ?? [],
        authentication: doc.authentication?.map(k => typeof k === 'string' ? k :k.id) ?? [],
        service: doc.service?.map(s => ({
          id: typeof s === 'string' ? s : s.id,
          type: typeof s === 'string' ? s : s.type,
          serviceEndpoint: typeof s === 'string' ? s : {
            uri: s.serviceEndpoint.uri,
            accept: s.serviceEndpoint.accept,
            routingKeys: typeof s === 'string' ? [] : s.serviceEndpoint.routingKeys
          }})) ?? [],
        verificationMethod: doc.verificationMethod?.map(v => {
          const type = v.type;
          const format = type === 'JsonWebKey2020' ? 'JWK' : type === 'X25519KeyAgreementKey2019' || type === 'Ed25519VerificationKey2018' ? 'Base58' : type === 'X25519KeyAgreementKey2020' || type === 'Ed25519VerificationKey2020' ? 'Multibase' : type;
          const value = format === 'JWK' ? v.publicKeyJwk : format === 'Base58' ? v.publicKeyBase58 : format === 'Multibase' ? v.publicKeyMultibase : null;
          const key = type === 'JsonWebKey2020' ? 'publicKeyJwk' : type === 'X25519KeyAgreementKey2019' || type === 'Ed25519VerificationKey2018' ? 'publicKeyBase58' : type === 'X25519KeyAgreementKey2020' || type === 'Ed25519VerificationKey2020' ? 'publicKeyMultibase' : type;
          return {
            id: v.id,
            type,
            controller: v.controller,
            [key] : value
          }
        }) ?? []
      };
      return newDoc
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