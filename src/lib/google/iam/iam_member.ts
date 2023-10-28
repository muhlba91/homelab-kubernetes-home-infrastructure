import * as gcp from '@pulumi/gcp';
import { Output } from '@pulumi/pulumi';

import { gcpConfig } from '../../configuration';
import { sanitizeText } from '../../util/string';

/**
 * Defines a new IAM member.
 *
 * @param {string} name the name of the account
 * @param {Output<string>} member the name of the member
 * @param {string[]} roles the roles
 * @param {string} project the GCP project (optional)
 */
export const createIAMMember = (
  name: string,
  member: Output<string>,
  roles: readonly string[],
  {
    project = gcpConfig.project,
  }: {
    readonly project?: string;
  },
) => {
  roles.forEach(
    (role) =>
      new gcp.projects.IAMMember(
        `gcp-iam-member-${name}-${sanitizeText(role)}`,
        {
          member: member,
          role: role,
          project: project,
        },
        {},
      ),
  );
};
