package configs

import (
	"strings"
)

// sanitizeSecretsFile sanitizes the secrets file by adhering to Talos' formatting requirements.
// secrets: the secrets file content to be sanitized
func sanitizeSecretsFile(secrets string) string {
	r := strings.NewReplacer(
		"cert:", "crt:",
		"bootstrapToken:", "bootstraptoken:",
		"secretboxEncryptionSecret:", "secretboxencryptionsecret:",
		"k8sAggregator:", "k8saggregator:",
		"k8sServiceaccount:", "k8sserviceaccount:",
	)
	return r.Replace(secrets)
}
