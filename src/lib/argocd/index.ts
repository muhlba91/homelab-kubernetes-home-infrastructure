import { local } from '@pulumi/command';
import * as k8s from '@pulumi/kubernetes';
import { CustomResourceOptions, Resource } from '@pulumi/pulumi';

import {
  argocdConfig,
  clusterConfig,
  environment,
  k0sConfig,
} from '../configuration';
import { getGitHubRepository } from '../github/repository';
import { writeFileContents } from '../util/file';
import { renderTemplate } from '../util/template';

import { deploySecrets } from './secrets';

/**
 * Creates the ArgoCD resources.
 *
 * @param {string} kubeConfig the kubernetes config
 * @param {string} ksopsCredentials the ksops credentials for GCP
 * @param {string} argocdAdminPassword the argocd admin password
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const deployArgoCDResources = async (
  kubeConfig: string,
  ksopsCredentials: string,
  argocdAdminPassword: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
) => {
  const provider = new k8s.Provider(clusterConfig.name + '-cluster', {
    kubeconfig: kubeConfig,
  });

  await deploySecrets(ksopsCredentials, argocdAdminPassword, provider, {
    pulumiOptions: pulumiOptions,
  });
  await deployArgoCD(argocdAdminPassword, { pulumiOptions: pulumiOptions });
};

/**
 * Deploys ArgoCD.
 *
 * @param {string} argocdAdminPassword the argocd admin password
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
const deployArgoCD = async (
  argocdAdminPassword: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
) => {
  writeFileContents(
    'outputs/values-argocd.yml',
    renderTemplate('assets/helm/argocd.yml.j2', {
      environment: environment,
      argocdAdminPassword: argocdAdminPassword,
    }),
    {}
  );
  const helmInstall = new local.Command(
    'helm-argocd',
    {
      create: './assets/helm/install.sh',
      environment: {
        DEPLOYMENT_ID: 'argocd',
        DEPLOYMENT_ENV: environment,
        DEPLOYMENT_NAMESPACE: 'argocd',
        HELM_REPO: 'https://argoproj.github.io/argo-helm',
        HELM_CHART_NAME: 'argo-cd',
      },
    },
    pulumiOptions
  );

  const applicationsRepository = (
    await getGitHubRepository(argocdConfig.applicationsRepository.repository, {
      pulumiOptions: pulumiOptions,
    })
  ).httpCloneUrl;
  new k8s.helm.v3.Release(
    'argocd-cluster-applications-' + environment,
    {
      chart: 'argocd-apps',
      namespace: 'argocd',
      name: 'argocd-cluster-applications-' + environment,
      repositoryOpts: {
        repo: 'https://argoproj.github.io/argo-helm',
      },
      version: k0sConfig.argocdApps.version,
      cleanupOnFail: false,
      dependencyUpdate: false,
      values: {
        applications: [
          {
            name: 'cluster-applications',
            namespace: 'argocd',
            project: 'default',
            additionalLabels: {},
            additionalAnnotations: {},
            revisionHistoryLimit: 1,
            finalizers: ['resources-finalizer.argocd.argoproj.io'],
            destination: {
              namespace: 'argocd',
              server: 'https://kubernetes.default.svc',
            },
            sources: [
              {
                repoURL: applicationsRepository,
                targetRevision: argocdConfig.applicationsRepository.branch,
                path: 'library/charts/applications',
                helm: {
                  valueFiles: [
                    '/app-of-apps/values.yaml',
                    '/app-of-apps/values-' + environment + '.yaml',
                  ],
                },
              },
            ],
            syncPolicy: {
              automated: {
                prune: false,
                selfHeal: true,
                allowEmpty: false,
              },
              syncOptions: [
                'CreateNamespace=false',
                'FailOnSharedResource=true',
              ],
            },
          },
        ],
      },
    },
    {
      ...pulumiOptions,
      dependsOn: (
        (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
      ).concat(helmInstall),
    }
  );
};
