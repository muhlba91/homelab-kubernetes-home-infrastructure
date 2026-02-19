package google

// Config defines configuration data for GCP.
type Config struct {
	// Project is the GCP project ID.
	Project string `yaml:"project,omitempty"`
	// DNSProject is the GCP project ID for DNS.
	DNSProject string `yaml:"dnsProject,omitempty"`
	// EncryptionKey is the encryption key configuration for GCP.
	EncryptionKey *EncryptionKeyConfig `yaml:"encryptionKey,omitempty"`
}

// EncryptionKeyConfig defines encryption key configuration data for GCP.
type EncryptionKeyConfig struct {
	// Location is the location of the encryption key.
	Location string `yaml:"location,omitempty"`
	// KeyringID is the ID of the keyring.
	KeyringID string `yaml:"keyringId,omitempty"`
	// CryptoKeyID is the ID of the crypto key.
	CryptoKeyID string `yaml:"cryptoKeyId,omitempty"`
}
