/**
 * Key pair signer
 */
export interface KeyPairSigner {
    /**
     * Signer function
     */
    readonly sign: (options: KeyPairSignerOptions) => Promise<Uint8Array>;
}
/**
 * Key pair signer options
 */
export interface KeyPairSignerOptions {
    readonly data: Uint8Array | Uint8Array[];
}
