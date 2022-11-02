import { type IJWE, JsonWebEncryptionSuite, X25519KeyAgreementKey2019 } from "@aviarytech/crypto";
import type {
  IDIDCommPayload,
  IDIDResolver,
  ISecretResolver,
} from "$lib/interfaces.js";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "$lib/constants.js";
import { DIDDocumentVerificationMethod } from "@aviarytech/dids";

export class DIDCommCore {
  constructor(
    private didResolver: IDIDResolver,
    private secretResolver: ISecretResolver
  ) {}

  async packMessage(did: string, payload: IDIDCommPayload): Promise<IJWE> {
    try {
      // get the key agreement keys
      const didDoc = await this.didResolver.resolve(did);
      let kaks = didDoc.getAllKeyAgreements();

      const encrypter = new JsonWebEncryptionSuite().createEncrypter();
      const publicKeyResolver = async (id: string) => {
        const key = kaks.find((k: any) => id === k.id);
        if (key) {
          return await new DIDDocumentVerificationMethod(key).asJsonWebKey()
        }
        throw new Error(
          "publicKeyResolver does not suppport IRI " + JSON.stringify(id)
        );
      };

      const recipients = kaks.map((k: any) => {
        return {
          header: {
            kid: k.id,
            alg: "ECDH-ES+A256KW",
          },
        };
      });

      const jwe = await encrypter.encrypt({
        data: payload,
        recipients,
        publicKeyResolver,
      });

      return jwe;
    } catch (e) {
      throw e;
    }
  }

  async unpackMessage(
    jwe: IJWE,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<IDIDCommPayload> {
    if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.ENCRYPTED) {
      const decrypter = new JsonWebEncryptionSuite().createDecrypter();
      let keys = (await Promise.all(
        jwe.recipients?.map((r) => this.secretResolver.resolve(r.header.kid)) ?? []
      )).filter((k) => k);
      if (keys.length === 0) {
        throw new Error(`No matching keys found in the recipients list`);
      }
      const jwk = await keys[0].asJsonWebKey();
      const keyAgreementKey = await X25519KeyAgreementKey2019.fromJWK(jwk);
      try {
        return decrypter.decrypt({ jwe, keyAgreementKey });
      } catch (e) {
        // console.log(e);
      }
    } else if (mediaType === DIDCOMM_MESSAGE_MEDIA_TYPE.SIGNED) {
      // not yet supported.
      throw new Error(`${mediaType} not yet supported`);
    }
    throw Error(`DIDComm media type not supported: ${mediaType}`);
  }
}
