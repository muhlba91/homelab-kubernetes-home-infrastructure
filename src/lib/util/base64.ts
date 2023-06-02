/**
 * Base64-encodes a string.
 *
 * @param {string} data: the data to encode
 * @returns {string} the encoded string
 */
export const b64encode = (data: string): string => {
  const buffer = Buffer.from(data, 'utf-8');
  return buffer.toString('base64');
};

/**
 * Base64-decodes a string.
 *
 * @param {string} data: the data to decode
 * @returns {string} the decoded string
 */
export const b64decode = (data: string): string => {
  const buffer = Buffer.from(data, 'base64');
  return buffer.toString('utf-8');
};
