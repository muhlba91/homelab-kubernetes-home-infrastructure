import { passwordsConfig, secretStoresConfig } from '../configuration';
import { createRandomPassword } from '../util/random';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the password resources.
 */
export const createPasswords = () => {
  Object.entries(passwordsConfig.data ?? {}).forEach(
    ([name, passwordConfig]) => {
      const password = createRandomPassword(name, {
        length: passwordConfig.length,
        special: passwordConfig.special,
      });
      writeToVault(
        passwordConfig.vaultPath ?? name,
        password.password.apply((passwd) =>
          JSON.stringify({ [passwordConfig.vaultKey ?? 'password']: passwd }),
        ),
        secretStoresConfig.vaultMount,
      );
    },
  );
};
