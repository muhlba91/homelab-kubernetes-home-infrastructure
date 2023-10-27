import { local } from '@pulumi/command';
import * as kubernetes from '@pulumi/kubernetes';
import { CustomResourceOptions, Resource } from '@pulumi/pulumi';

import { argocdConfig, environment, k0sConfig } from '../configuration';
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
  provider: kubernetes.Provider,
  ksopsCredentials: string,
  argocdAdminPassword: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  await deploySecrets(ksopsCredentials, argocdAdminPassword, provider, {
    pulumiOptions: pulumiOptions,
  });
  await deployArgoCD(argocdAdminPassword, provider, {
    pulumiOptions: pulumiOptions,
  });
};

/**
 * Deploys ArgoCD.
 *
 * @param {string} argocdAdminPassword the argocd admin password
 * @param {k8s.Provider} provider the kubernetes provider
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
const deployArgoCD = async (
  argocdAdminPassword: string,
  provider: kubernetes.Provider,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  writeFileContents(
    'outputs/values-argocd.yml',
    renderTemplate('assets/helm/argocd.yml.j2', {
      environment: environment,
      argocdAdminPassword: argocdAdminPassword,
    }),
    {},
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
    pulumiOptions,
  );

  const applicationsRepository = (
    await getGitHubRepository(argocdConfig.applicationsRepository.repository, {
      pulumiOptions: pulumiOptions,
    })
  ).httpCloneUrl;
  // new kubernetes.helm.v3.Release(
  //   'argocd-cluster-applications-' + environment,
  //   {
  //     chart: 'argocd-apps',
  //     namespace: 'argocd',
  //     name: 'argocd-cluster-applications-' + environment,
  //     repositoryOpts: {
  //       repo: 'https://argoproj.github.io/argo-helm',
  //     },
  //     version: k0sConfig.argocdApps.version,
  //     cleanupOnFail: false,
  //     dependencyUpdate: false,
  //     values: {
  //       applications: [
  //         {
  //           name: 'cluster-applications',
  //           namespace: 'argocd',
  //           project: 'default',
  //           additionalLabels: {},
  //           additionalAnnotations: {},
  //           revisionHistoryLimit: 1,
  //           finalizers: ['resources-finalizer.argocd.argoproj.io'],
  //           destination: {
  //             namespace: 'argocd',
  //             server: 'https://kubernetes.default.svc',
  //           },
  //           sources: [
  //             {
  //               repoURL: applicationsRepository,
  //               targetRevision: argocdConfig.applicationsRepository.branch,
  //               path: 'library/charts/applications',
  //               helm: {
  //                 valueFiles: [
  //                   '/app-of-apps/values.yaml',
  //                   '/app-of-apps/values-' + environment + '.yaml',
  //                 ],
  //               },
  //             },
  //           ],
  //           syncPolicy: {
  //             automated: k0sConfig.argocdApps.enabled
  //               ? {
  //                   prune: false,
  //                   selfHeal: true,
  //                   allowEmpty: false,
  //                 }
  //               : {},
  //             syncOptions: [
  //               'CreateNamespace=false',
  //               'FailOnSharedResource=true',
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   {
  //     ...pulumiOptions,
  //     provider: provider,
  //     dependsOn: (
  //       (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
  //     ).concat(helmInstall),
  //     ignoreChanges:[
  //       "compat","allowNullValues","atomic","checksum",
  //     ]
  //   },
  // );
};
