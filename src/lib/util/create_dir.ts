import * as fs from 'fs';

/**
 * Creates the directory.
 * Attention: removes the entire directory beforehand!
 *
 * @param {string} path the path to the file
 * @returns {string} the contents
 */
export const createDir = (path: string) => {
  fs.rmSync(path, { recursive: true, force: true });
  fs.mkdirSync(path);
};
