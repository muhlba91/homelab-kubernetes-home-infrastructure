import * as k8s from '@pulumi/kubernetes';
import { CustomResourceOptions } from '@pulumi/pulumi';

import { argocdConfig, clusterConfig } from '../configuration';
import { getGitHubRepository } from '../github/repository';
import { createGitHubSshKey } from '../github/ssh_key';
import { b64encode } from '../util/base64';

/**
 * Creates the ArgoCD secrets.
 *
 * @param {string} ksopsCredentials the ksops credentials for GCP
 * @param {string} argocdAdminPassword the argocd admin password
 * @param {k8s.Provider} provider the kubernetes provider
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const deploySecrets = async (
  ksopsCredentials: string,
  argocdAdminPassword: string,
  provider: k8s.Provider,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  deployAdminPasswordSecrets(argocdAdminPassword, provider, {
    pulumiOptions: pulumiOptions,
  });
  await deployRepositorySecrets(provider, { pulumiOptions: pulumiOptions });
  deployKsopsSecrets(ksopsCredentials, provider, {
    pulumiOptions: pulumiOptions,
  });
};

/**
 * Creates the ArgoCD admin password secrets.
 *
 * @param {string} argocdAdminPassword the argocd admin password
 * @param {k8s.Provider} provider the kubernetes provider
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
const deployAdminPasswordSecrets = (
  argocdAdminPassword: string,
  provider: k8s.Provider,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  new k8s.core.v1.Secret(
    'k8s-secret-argocd-admin-password',
    {
      metadata: {
        name: 'argocd-admin-password',
        namespace: 'argocd',
      },
      data: {
        password: b64encode(argocdAdminPassword),
      },
    },
    {
      ...pulumiOptions,
      provider: provider,
    },
  );
};

/**
 * Creates the ksops secrets.
 *
 * @param {string} ksopsCredentials the ksops credentials for GCP
 * @param {k8s.Provider} provider the kubernetes provider
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
const deployKsopsSecrets = (
  ksopsCredentials: string,
  provider: k8s.Provider,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  new k8s.core.v1.Secret(
    'k8s-secret-ksops',
    {
      metadata: {
        name: 'ksops-credentials',
        namespace: 'argocd',
      },
      data: {
        'credentials.json': ksopsCredentials,
      },
    },
    {
      ...pulumiOptions,
      provider: provider,
    },
  );
};

/**
 * Creates the ArgoCD repository secrets.
 *
 * @param {k8s.Provider} provider the kubernetes provider
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const deployRepositorySecrets = async (
  provider: k8s.Provider,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  const githubSshKey = createGitHubSshKey(
    'argocd-' + clusterConfig.name + '-cluster',
    argocdConfig.valuesRepository.repository,
    { pulumiOptions: pulumiOptions },
  );

  const applicationsRepository = (
    await getGitHubRepository(argocdConfig.applicationsRepository.repository, {
      pulumiOptions: pulumiOptions,
    })
  ).httpCloneUrl;
  new k8s.core.v1.Secret(
    'k8s-secret-argocd-repository-applications',
    {
      metadata: {
        name: 'argocd-repository-applications',
        namespace: 'argocd',
        labels: {
          'argocd.argoproj.io/secret-type': 'repository',
        },
      },
      data: {
        url: b64encode(applicationsRepository),
      },
    },
    {
      ...pulumiOptions,
      provider: provider,
    },
  );

  const valuesRepository = (
    await getGitHubRepository(argocdConfig.valuesRepository.repository, {
      pulumiOptions: pulumiOptions,
    })
  ).sshCloneUrl;
  new k8s.core.v1.Secret(
    'k8s-secret-argocd-repository-values',
    {
      metadata: {
        name: 'argocd-repository-values',
        namespace: 'argocd',
        labels: {
          'argocd.argoproj.io/secret-type': 'repository',
        },
      },
      data: {
        url: b64encode(valuesRepository),
        sshPrivateKey: githubSshKey.apply((key) => b64encode(key.trim())),
      },
    },
    {
      ...pulumiOptions,
      provider: provider,
    },
  );
};
