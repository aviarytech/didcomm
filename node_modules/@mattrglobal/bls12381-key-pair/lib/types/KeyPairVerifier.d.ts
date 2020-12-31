/**
 * Key pair verifier
 */
export interface KeyPairVerifier {
    /**
     * Key pair verify function
     */
    readonly verify: (options: KeyPairVerifierOptions) => Promise<boolean>;
}
/**
 * Key pair verifier options
 */
export interface KeyPairVerifierOptions {
    readonly data: Uint8Array | Uint8Array[];
    readonly signature: Uint8Array;
}
