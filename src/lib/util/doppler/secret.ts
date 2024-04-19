import { Output } from '@pulumi/pulumi';
import * as doppler from '@pulumiverse/doppler';

import { environment, secretStoresConfig } from '../../configuration';

/**
 * Stores a value in Doppler.
 *
 * @param {string} key the key
 * @param {Output<string>} value the value
 * @param {string} project the project name
 */
export const writeToDoppler = (
  key: string,
  value: Output<string>,
  project: string,
) => {
  if (secretStoresConfig.doppler) {
    new doppler.Secret(`doppler-${project}-${environment}-${key}`, {
      name: key,
      value: value,
      project: project,
      config: environment,
    });
  }
};
