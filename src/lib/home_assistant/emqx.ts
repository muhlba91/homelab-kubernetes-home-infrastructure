import { secretStoresConfig } from '../configuration';
import { createRandomPassword } from '../util/random';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant EMQX data.
 */
export const createHomeAssistantEmqx = () => {
  const password = createRandomPassword('home-assistant-emqx', {
    length: 20,
  });
  writeToVault(
    'home-assistant-emqx',
    password.password.apply((passwd) => JSON.stringify({ password: passwd })),
    secretStoresConfig.vaultMount,
  );
};
