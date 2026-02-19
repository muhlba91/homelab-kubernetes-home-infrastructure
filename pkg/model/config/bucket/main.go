package bucket

// Config defines configuration data for S3 buckets.
type Config struct {
	// GCS is a map of bucket configurations.
	GCS map[string]*BucketConfig `yaml:"gcs,omitempty"`
}

// BucketConfig defines configuration data for an S3 bucket.
//
// Attention: currently only one bucket is supported!
//
//nolint:revive // this is intentional naming
type BucketConfig struct {
	// VaultPath is the path to the secret in Vault.
	VaultPath *string `yaml:"vaultPath,omitempty"`
	// DefaultName is the default name of the bucket.
	DefaultName *string `yaml:"defaultName,omitempty"`
	// CORS is the CORS configuration for the bucket.
	CORS *CorsConfig `yaml:"cors,omitempty"`
	// DefaultBucket indicates if this is the default bucket.
	DefaultBucket *bool `yaml:"defaultBucket,omitempty"`
	// MainBucket indicates if this is the main bucket.
	MainBucket *bool `yaml:"mainBucket,omitempty"`
	// BackupBucket indicates if this is the backup bucket.
	BackupBucket *bool `yaml:"backupBucket,omitempty"`
}

// CorsConfig defines CORS configuration data for an S3 bucket.
type CorsConfig struct {
	// MaxAgeSeconds is the maximum age of the CORS preflight request.
	MaxAgeSeconds *int `yaml:"maxAgeSeconds,omitempty"`
	// Method is the list of allowed HTTP methods.
	Method []string `yaml:"method,omitempty"`
	// Origin is the list of allowed origins.
	Origin []string `yaml:"origin,omitempty"`
	// ResponseHeader is the list of allowed response headers.
	ResponseHeader []string `yaml:"responseHeader,omitempty"`
}
