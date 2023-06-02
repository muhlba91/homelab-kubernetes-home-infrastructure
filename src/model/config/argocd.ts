/**
 * Defines ArgoCD configuration.
 */
export type ArgocdConfig = {
  readonly applicationsRepository: ArgocdRepositoryConfig;
  readonly valuesRepository: ArgocdRepositoryConfig;
};

/**
 * Defines ArgoCD repository configuration.
 */
export type ArgocdRepositoryConfig = {
  readonly repository: string;
  readonly branch: string;
};
