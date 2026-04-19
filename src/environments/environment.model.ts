export interface AppEnvironment {
  production: boolean;
  analysisStoreDevHeadersEnabled: boolean;
  analysisStoreApiPrefix: string;
  apiAllowedPrefixes: string[];
  authEndpoints: {
    login: string;
    register: string;
    refresh: string;
    logout: string;
    me: string;
  };
  analysisStoreEndpoints: {
    importsTimelinesValidate: string;
    importsPanelsValidate: string;
    timelines: string;
    panels: string;
  };
}
