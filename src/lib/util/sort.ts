import { UnwrappedObject } from '@pulumi/pulumi';

import { ServerData } from '../../model/server';

/**
 * Sorts by string.
 *
 * @param {string} a: string a
 * @param {string} b: string b
 * @returns {number} the comparison result
 */
export const sortString = (a: string, b: string) => {
  const nameA = a.toLowerCase();
  const nameB = b.toLowerCase();
  return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
};

/**
 * Sorts by ServerData.
 *
 * @param {ServerData | UnwrappedObject<ServerData>} a: ServerData a
 * @param {ServerData | UnwrappedObject<ServerData>} b: ServerData b
 * @returns {number} the comparison result
 */
export const sortServerData = (
  a: ServerData | UnwrappedObject<ServerData>,
  b: ServerData | UnwrappedObject<ServerData>,
) => sortString(a.hostname, b.hostname);

/**
 * Sorts by ServerData.
 *
 * @param {ServerData[] | UnwrappedObject<ServerData[]>} array: ServerData array
 * @returns {number} the comparison result
 */
export const sortedServerData = (
  array: readonly ServerData[] | UnwrappedObject<readonly ServerData[]>,
) => array.map((server) => server).sort(sortServerData);
