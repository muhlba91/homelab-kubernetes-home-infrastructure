package file

import (
	"fmt"
	"os"

	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage/scaleway"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
)

// WriteAndUpload writes the given content to a file and uploads it to Google Cloud Storage.
// ctx: The Pulumi context.
// name: The name of the file to be created and uploaded.
// content: The content to be written to the file, provided as a Pulumi StringOutput.
// permissions: The file permissions to be set on the local file.
func WriteAndUpload(
	ctx *pulumi.Context,
	name string,
	content pulumi.StringInput,
	permissions ...os.FileMode,
) pulumi.Output {
	return scaleway.WriteFileAndUpload(ctx, &storage.WriteFileAndUploadOptions{
		Name:        name,
		Content:     content,
		OutputPath:  fmt.Sprintf("./outputs/%s", config.Environment),
		BucketID:    config.BucketID,
		BucketPath:  config.BucketPath,
		Labels:      config.CommonLabels(),
		Permissions: permissions,
	})
}
