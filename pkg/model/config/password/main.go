package password

// Config defines configuration data for passwords.
type Config struct {
	// Data is a map of password configurations.
	Data map[string]*PasswordConfig `yaml:"data,omitempty"`
}

// PasswordConfig defines configuration data for a password.
//
//nolint:revive // this is intentional naming
type PasswordConfig struct {
	// VaultPath is the path to the secret in Vault.
	VaultPath *string `yaml:"vaultPath,omitempty"`
	// VaultKey is the key of the secret in Vault.
	VaultKey *string `yaml:"vaultKey,omitempty"`
	// Length is the length of the password.
	Length *int `yaml:"length,omitempty"`
	// Special indicates if special characters should be used.
	Special *bool `yaml:"special,omitempty"`
}
