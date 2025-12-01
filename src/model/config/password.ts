import { StringMap } from '../map';

/**
 * Defines configuration data for passwords.
 */
export interface PasswordsConfig {
  readonly data?: StringMap<PasswordConfig>;
}

/**
 * Defines configuration data for a password.
 */
export interface PasswordConfig {
  readonly vaultPath?: string;
  readonly vaultKey?: string;
  readonly length?: number;
  readonly special?: boolean;
}
