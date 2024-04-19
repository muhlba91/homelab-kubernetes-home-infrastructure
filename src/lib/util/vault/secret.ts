import { Output } from '@pulumi/pulumi';
import * as vault from '@pulumi/vault';

import { secretStoresConfig } from '../../configuration';

/**
 * Stores a value in Vault.
 *
 * @param {string} key the key
 * @param {Output<string>} value the value
 * @param {vault.Mount} vaultStore the vault store
 * @param {vault.Provider} provider the Vault provider
 */
export const writeToVault = (
  key: string,
  value: Output<string>,
  path: string,
) => {
  if (secretStoresConfig.vault) {
    new vault.kv.SecretV2(
      `vault-secret-${path}-${key}`,
      {
        mount: path,
        name: key,
        dataJson: value,
      },
      {},
    );
  }
};
