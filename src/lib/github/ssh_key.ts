import * as github from '@pulumi/github';
import { CustomResourceOptions, Output } from '@pulumi/pulumi';

import { createSSHKey } from '../util/ssh_key';

/**
 * Creates the GitHub SSH Key resources.
 *
 * @param {string} name the name of the key
 * @param {string} repository the GitHub repository
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Output<string>} the SSH private key
 */
export const createGitHubSshKey = (
  name: string,
  repository: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Output<string> => {
  const keyName = `gh-ssh-key-${repository}-${name}`;

  const key = createSSHKey(keyName, {});

  new github.UserSshKey(
    keyName,
    {
      title: name,
      key: key.publicKeyOpenssh,
    },
    pulumiOptions,
  );

  return key.privateKeyOpenssh;
};
