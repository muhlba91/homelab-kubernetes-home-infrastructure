import * as github from '@pulumi/github';
import { CustomResourceOptions } from '@pulumi/pulumi';

/**
 * Gets the GitHub repository data.
 *
 * @param {string} repository the GitHub repository
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<github.GetRepositoryResult>} the repository
 */
export const getGitHubRepository = async (
  repository: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
): Promise<github.GetRepositoryResult> =>
  await github.getRepository(
    {
      fullName: repository,
    },
    pulumiOptions
  );
