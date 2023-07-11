import * as google from '@pulumi/google-native';
import { CustomResourceOptions } from '@pulumi/pulumi';

/**
 * Gets a zone.
 *
 * @param {string} project the project
 * @param {string} name the zone's name
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 * @returns {Promise<google.dns.v1.GetManagedZoneResult>} the zone data
 */
export const getZone = async (
  project: string,
  name: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Promise<google.dns.v1.GetManagedZoneResult> =>
  await google.dns.v1.getManagedZone(
    {
      managedZone: name,
      project: project,
    },
    pulumiOptions,
  );
