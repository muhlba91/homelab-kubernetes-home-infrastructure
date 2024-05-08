/**
 * Defines Home Assistant configuration.
 */
export interface HomeAssistantConfig {
  readonly bucketArn: string;
  readonly firehose: HomeAssistantFirehoseConfig;
  readonly glue: HomeAssistantGlueConfig;
  readonly athena: HomeAssistantAthenaConfig;
}

/**
 * Defines Home Assistant Firehose configuration.
 */
export interface HomeAssistantFirehoseConfig {
  readonly buffer: HomeAssistantFirehoseBufferConfig;
  readonly compression: string;
  readonly lambda: HomeAssistantFirehoseLambdaConfig;
}

/**
 * Defines Home Assistant Fierehose buffer configuration.
 */
export interface HomeAssistantFirehoseBufferConfig {
  readonly interval: number;
  readonly size: number;
}

/**
 * Defines Home Assistant Fierehose Lambda configuration.
 */
export interface HomeAssistantFirehoseLambdaConfig {
  readonly memory: number;
  readonly timeout: number;
  readonly buffer: HomeAssistantFirehoseBufferConfig;
}

/**
 * Defines Home Assistant Glue configuration.
 */
export interface HomeAssistantGlueConfig {
  readonly schedule: string;
}

/**
 * Defines Home Assistant Athena configuration.
 */
export interface HomeAssistantAthenaConfig {
  readonly resultsExpiryInDays: number;
  readonly bytesScannedCutoffPerQuery: number;
}
