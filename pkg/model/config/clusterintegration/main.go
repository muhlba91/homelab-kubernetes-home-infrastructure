package clusterintegration

// Config defines cluster integration configuration.
type Config struct {
	// Kubeconfig is the encrypted kubeconfig for cluster integration.
	Kubeconfig string `yaml:"kubeconfig,omitempty"`
}
