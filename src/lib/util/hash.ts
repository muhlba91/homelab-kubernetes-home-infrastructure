import * as crypto from 'crypto';

/**
 * Hashes a text.
 *
 * @param {string} text: the text to hash
 * @returns {string} the hashed string
 */
export const hashText = (text: string): string => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(text);
  return hashSum.digest('hex');
};
