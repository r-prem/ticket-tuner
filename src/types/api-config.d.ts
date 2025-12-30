export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface ApiConfigStatus {
  configured: boolean;
  lastTested?: number;
  testSuccess?: boolean;
  error?: string;
}
