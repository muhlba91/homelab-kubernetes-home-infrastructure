import { secretStoresConfig } from '../configuration';
import { createRandomPassword } from '../util/random';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant Node-RED data.
 */
export const createHomeAssistantNodeRed = () => {
  const password = createRandomPassword(
    'home-assistant-node-red-credential-secret',
    {},
  );
  writeToVault(
    'home-assistant-node-red',
    password.password.apply((passwd) =>
      JSON.stringify({ credential_secret: passwd }),
    ),
    secretStoresConfig.vaultMount,
  );
};
