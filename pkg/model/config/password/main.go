package password

// Config defines configuration data for passwords.
type Config struct {
	// Data is a map of Vault paths to the password entries stored at that path.
	Data map[string]map[string]*PasswordConfig `yaml:"data,omitempty"`
}

// PasswordConfig defines configuration data for a password.
//
//nolint:revive // this is intentional naming
type PasswordConfig struct {
	// Length is the length of the password.
	Length *int `yaml:"length,omitempty"`
	// Special indicates if special characters should be used.
	Special *bool `yaml:"special,omitempty"`
	// Password is the password value.
	Password *string `yaml:"password,omitempty"`
}
