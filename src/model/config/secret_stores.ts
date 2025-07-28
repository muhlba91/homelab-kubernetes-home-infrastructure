/**
 * Defines secret stores configuration.
 */
export interface SecretStoresConfig {
  readonly vault: boolean;
  readonly vaultMount: string;
}
