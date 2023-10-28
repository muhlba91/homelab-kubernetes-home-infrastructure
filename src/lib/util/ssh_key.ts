import { PrivateKey } from '@pulumi/tls';

import { environment } from '../configuration';

/**
 * Defines a new SSH key.
 *
 * @param {string} name the name of the key
 * @param {number} rsaBits the number of bits for the key (default: 4096)
 * @return {PrivateKey} the generated SSH key
 */
export const createSSHKey = (
  name: string,
  {
    rsaBits = 4096,
  }: {
    readonly rsaBits?: number;
  },
): PrivateKey =>
  new PrivateKey(`ssh-key-${name}-${environment}`, {
    algorithm: 'RSA',
    rsaBits: rsaBits,
  });
