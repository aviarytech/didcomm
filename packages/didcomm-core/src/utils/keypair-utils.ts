import { Ed25519KeyPair } from "@transmute/ed25519-key-pair";
import { Bls12381G2KeyPair } from "@mattrglobal/jsonld-signatures-bbs";
import { Secp256k1KeyPair } from "@transmute/secp256k1-key-pair";
import { WebCryptoKey } from "@transmute/web-crypto-key-pair";
import { X25519KeyPair } from "@transmute/x25519-key-pair";

const getKeyPairForKtyAndCrv = (kty: string, crv: string) => {
  if (kty === "OKP") {
    if (crv === "Ed25519") {
      return Ed25519KeyPair;
    }
    if (crv == "X25519") {
      return X25519KeyPair;
    }
  }
  if (kty === "EC") {
    if (crv === "secp256k1") {
      return Secp256k1KeyPair;
    }

    if (crv === "BLS12381_G2") {
      return Bls12381G2KeyPair;
    }

    if (["P-256", "P-384", "P-521"].includes(crv)) {
      return WebCryptoKey;
    }
  }
  throw new Error(`getKeyPairForKtyAndCrv does not support: ${kty} and ${crv}`);
};

export const getKeyPairForType = (k: any) => {
  if (k.type === "JsonWebKey2020") {
    return getKeyPairForKtyAndCrv(k.publicKeyJwk.kty, k.publicKeyJwk.crv);
  }
  if (k.type === "Ed25519VerificationKey2018") {
    return Ed25519KeyPair;
  }
  if (k.type === "X25519KeyAgreementKey2019") {
    return X25519KeyPair;
  }
  if (k.type === "EcdsaSecp256k1VerificationKey2019") {
    return Secp256k1KeyPair;
  }
  if (k.type === "Bls12381G2Key2020") {
    return Bls12381G2KeyPair;
  }

  if (["P256Key2021", "P384Key2021", "P521Key2021"].includes(k.type)) {
    return WebCryptoKey;
  }

  throw new Error("getKeyPairForType does not support type: " + k.type);
};
