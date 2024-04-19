import * as gcp from '@pulumi/gcp';

import { sanitizeText } from '../../util/string';

/**
 * Creates an HMAC key for a Google service account.
 *
 * @param {string} serviceAccount the service account email to create the HMAC key for
 * @returns {gcp.storage.HmacKey} the HMAC key resource
 */
export const createHmacKey = (serviceAccount: string): gcp.storage.HmacKey =>
  new gcp.storage.HmacKey(
    `gcp-hmac-${sanitizeText(serviceAccount)}`,
    {
      serviceAccountEmail: serviceAccount,
    },
    {},
  );
