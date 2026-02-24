package serviceaccount

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// Create creates the Google service account resources.
// ctx: Pulumi context.
// googleConfig: Configuration for Google Cloud.
// secretStoresConfig: Configuration for secret stores (Vault).
func Create(
	ctx *pulumi.Context,
	googleConfig *google.Config,
	secretStoresConfig *secretstores.Config,
) map[string]*gmodel.User {
	users := make(map[string]*gmodel.User)

	for _, name := range googleConfig.ServiceAccounts {
		user := createAccount(ctx, name, googleConfig, secretStoresConfig)
		users[name] = user
	}

	return users
}
