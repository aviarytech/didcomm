import { IDIDResolver } from "@aviarytech/did-core";
import {
  IDIDCommAttachment,
  IDIDCommCore,
  IDIDCommPayload,
} from "./interfaces";
import { IJWE, JWE } from "@aviarytech/crypto-core";
import { DIDCOMM_MESSAGE_MEDIA_TYPE } from "./constants";
import { ISecretResolver } from "@aviarytech/did-secrets";

export class DIDCommCore {
  constructor(
    private didResolver: IDIDResolver,
    private secretResolver: ISecretResolver
  ) {}

  async packMessage(payload: IDIDCommPayload): Promise<IJWE> {
    try {
      // get the key agreement keys
      const didDoc = await this.didResolver.resolve(payload.to);
      let kaks = didDoc.getAllKeyAgreements();

      const cipher = new JWE.Cipher();
      const encrypter = cipher.createEncrypter();
      const publicKeyResolver = (id: string) => {
        const key = kaks.find((k) => id === k.id);
        if (key) {
          return key.asJsonWebKey();
        }
        throw new Error(
          "publicKeyResolver does not suppport IRI " + JSON.stringify(id)
        );
      };

      const recipients = kaks.map((k) => {
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
      const cipher = new JWE.Cipher();
      const decrypter = cipher.createDecrypter();
      let keys = await Promise.all(
        jwe.recipients.map((r) => this.secretResolver.resolve(r.header.kid))
      );
      keys = keys.filter((k) => k);
      if (keys.length === 0) {
        throw new Error(`No matching keys found in the recipients list`);
      }
      const jwk = await keys[0].asJsonWebKey();
      const keyAgreementKey = await jwk.export({
        privateKey: true,
        type: "X25519KeyAgreementKey2019",
      });
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

export {
  IDIDCommCore,
  IDIDCommPayload,
  IDIDCommAttachment,
  DIDCOMM_MESSAGE_MEDIA_TYPE,
};
