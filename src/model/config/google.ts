/**
 * Defines configuration data for GCP.
 */
export interface GCPConfig {
  readonly project: string;
  readonly dnsProject: string;
  readonly encryptionKey: GCPEncryptionKeyConfig;
}

/**
 * Defines encryption key configuration data for GCP.
 */
export interface GCPEncryptionKeyConfig {
  readonly location: string;
  readonly keyringId: string;
  readonly cryptoKeyId: string;
}
