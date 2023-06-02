/**
 * Defines configuration data for GCP.
 */
export type GCPConfig = {
  readonly project: string;
  readonly encryptionKey: GCPEncryptionKeyConfig;
};

/**
 * Defines encryption key configuration data for GCP.
 */
export type GCPEncryptionKeyConfig = {
  readonly location: string;
  readonly keyringId: string;
  readonly cryptoKeyId: string;
};
