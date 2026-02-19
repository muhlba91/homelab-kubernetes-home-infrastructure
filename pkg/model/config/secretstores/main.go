package secretstores

// Config defines secret stores configuration.
type Config struct {
	// Vault indicates if Vault is enabled.
	Vault bool `yaml:"vault,omitempty"`
	// VaultMount is the mount path for Vault.
	VaultMount string `yaml:"vaultMount,omitempty"`
}
