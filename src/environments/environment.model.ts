export interface AppEnvironment {
  production: boolean;
  apiAllowedPrefixes: string[];
  authEndpoints: {
    login: string;
    register: string;
    refresh: string;
    logout: string;
    me: string;
  };
}
