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
