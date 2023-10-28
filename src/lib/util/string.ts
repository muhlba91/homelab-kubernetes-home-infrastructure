/**
 * Sanitizes a string
 *
 * @param {string} text the text to sanitize
 * @returns {string} the sanitized text
 */
export const sanitizeText = (text: string): string =>
  text.replace(/[^a-z0-9]/gi, '-');
