import { secretStoresConfig } from '../configuration';
import { createRandomPassword } from '../util/random';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant InfluxDB data.
 */
export const createHomeAssistantInfluxDb = () => {
  const password = createRandomPassword('home-assistant-influxdb', {
    special: false,
  });
  writeToVault(
    'home-assistant-influxdb',
    password.password.apply((passwd) => JSON.stringify({ password: passwd })),
    secretStoresConfig.vaultMount,
  );
};
