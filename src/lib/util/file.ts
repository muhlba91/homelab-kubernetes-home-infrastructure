import * as fs from 'fs';

import { Output } from '@pulumi/pulumi';

/**
 * Writes the contents to a file.
 *
 * @param {string} path the path to the file
 * @param {string} content the content
 * @param {string} permissions the permissions (default: 0644)
 */
export const writeFileContents = (
  path: string,
  content: string,
  { permissions = '0644' }: { readonly permissions?: string },
) => fs.writeFileSync(path, content, { mode: permissions });

/**
 * Writes the pulumi Output to a file.
 *
 * @param {string} path the path to the file
 * @param {Output<string>} content the content
 * @param {string} permissions the permissions (default: 0644)
 * @returns {Output<unknown>} to track state
 */
export const writeFilePulumi = (
  path: string,
  content: Output<string>,
  { permissions = '0644' }: { readonly permissions?: string },
): Output<unknown> =>
  content.apply((value) =>
    writeFileContents(path, value, { permissions: permissions }),
  );

/**
 * Reads the contents of a given file.
 *
 * @param {string} path the path to the file
 * @returns {string} the contents
 */
export const readFileContents = (path: string): string =>
  fs.readFileSync(path, 'utf8').toString();
