import { RandomPassword } from '@pulumi/random';

import { RandomPasswordData } from '../../model/random';

/**
 * Creates a random password.
 *
 * @param {string} name the password name
 * @param {number} length the length (default: 16)
 * @param {boolean} special enable special characters (default: true)
 * @returns {RandomPasswordData} the password
 */
export const createRandomPassword = (
  name: string,
  {
    length = 16,
    special = true,
  }: { readonly length?: number; readonly special?: boolean },
): RandomPasswordData => {
  const password = new RandomPassword(
    `password-${name}`,
    {
      length: length,
      special: special,
      lower: true,
      upper: true,
      number: true,
    },
    {},
  );
  return {
    resource: password,
    password: password.result,
  };
};
