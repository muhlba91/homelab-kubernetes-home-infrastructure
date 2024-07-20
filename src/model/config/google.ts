/**
 * Defines configuration data for GCP.
 */
export interface GoogleConfig {
  readonly project: string;
  readonly dnsProject: string;
  readonly encryptionKey: GoogleEncryptionKeyConfig;
}

/**
 * Defines encryption key configuration data for GCP.
 */
export interface GoogleEncryptionKeyConfig {
  readonly location: string;
  readonly keyringId: string;
  readonly cryptoKeyId: string;
}
