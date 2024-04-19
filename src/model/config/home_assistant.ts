/**
 * Defines Home Assistant configuration.
 */
export type HomeAssistantConfig = {
  readonly backupBucketId: string;
  readonly bucketArn: string;
  readonly firehose: HomeAssistantFirehoseConfig;
  readonly glue: HomeAssistantGlueConfig;
  readonly athena: HomeAssistantAthenaConfig;
};

/**
 * Defines Home Assistant Firehose configuration.
 */
export type HomeAssistantFirehoseConfig = {
  readonly buffer: HomeAssistantFirehoseBufferConfig;
  readonly compression: string;
  readonly lambda: HomeAssistantFirehoseLambdaConfig;
};

/**
 * Defines Home Assistant Fierehose buffer configuration.
 */
export type HomeAssistantFirehoseBufferConfig = {
  readonly interval: number;
  readonly size: number;
};

/**
 * Defines Home Assistant Fierehose Lambda configuration.
 */
export type HomeAssistantFirehoseLambdaConfig = {
  readonly memory: number;
  readonly timeout: number;
  readonly buffer: HomeAssistantFirehoseBufferConfig;
};

/**
 * Defines Home Assistant Glue configuration.
 */
export type HomeAssistantGlueConfig = {
  readonly schedule: string;
};

/**
 * Defines Home Assistant Athena configuration.
 */
export type HomeAssistantAthenaConfig = {
  readonly resultsExpiryInDays: number;
  readonly bytesScannedCutoffPerQuery: number;
};
