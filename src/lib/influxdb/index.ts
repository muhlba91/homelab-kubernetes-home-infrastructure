import { all } from '@pulumi/pulumi';

import { gatesConfig, secretStoresConfig } from '../configuration';
import { createRandomPassword } from '../util/random';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the InfluxDB resources.
 */
export const createInfluxDBResources = () => {
  if (!gatesConfig.influxdb! && !gatesConfig.homeAssistant) {
    return;
  }

  const password = createRandomPassword('influxdb-admin-password', {
    special: false,
  });
  const token = createRandomPassword('influxdb-admin-token', {
    length: 32,
    special: false,
  });
  writeToVault(
    'influxdb-user-admin',
    all([password.password, token.password]).apply(([passwd, tokn]) =>
      JSON.stringify({ password: passwd, token: tokn }),
    ),
    secretStoresConfig.vaultMount,
  );
};
