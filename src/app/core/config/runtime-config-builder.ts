import { AppEnvironment } from '../../../environments/environment.model';

export type RuntimeConfigShape = Partial<Omit<AppEnvironment, 'production'>>;

export type RuntimeEnvironmentVariables = Record<string, string | undefined>;

export function parseCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return parsed.length > 0 ? parsed : fallback;
}

export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return fallback;
}

export function buildRuntimeConfigFromEnv(
  runtimeEnv: RuntimeEnvironmentVariables,
  defaults: AppEnvironment,
): RuntimeConfigShape {
  const authPrefix = runtimeEnv['AUTH_API_PREFIX']?.trim() || '';
  const analysisStorePrefix = runtimeEnv['ANALYSIS_STORE_API_PREFIX']?.trim() || defaults.analysisStoreApiPrefix;

  return {
    analysisStoreDevHeadersEnabled: parseBoolean(
      runtimeEnv['ANALYSIS_STORE_DEV_HEADERS_ENABLED'],
      defaults.analysisStoreDevHeadersEnabled,
    ),
    analysisStoreApiPrefix: analysisStorePrefix,
    apiAllowedPrefixes: parseCsv(runtimeEnv['API_ALLOWED_PREFIXES'], defaults.apiAllowedPrefixes),
    authEndpoints: {
      login: runtimeEnv['AUTH_LOGIN_ENDPOINT'] || `${authPrefix}/auth/login`,
      register: runtimeEnv['AUTH_REGISTER_ENDPOINT'] || `${authPrefix}/users`,
      refresh: runtimeEnv['AUTH_REFRESH_ENDPOINT'] || `${authPrefix}/auth/refresh`,
      logout: runtimeEnv['AUTH_LOGOUT_ENDPOINT'] || `${authPrefix}/auth/logout`,
      me: runtimeEnv['AUTH_ME_ENDPOINT'] || `${authPrefix}/me`,
    },
    analysisStoreEndpoints: {
      importsTimelinesValidate:
        runtimeEnv['ANALYSIS_STORE_IMPORTS_TIMELINES_VALIDATE_ENDPOINT'] ||
        `${analysisStorePrefix}/api/imports/timelines/validate`,
      importsPanelsValidate:
        runtimeEnv['ANALYSIS_STORE_IMPORTS_PANELS_VALIDATE_ENDPOINT'] ||
        `${analysisStorePrefix}/api/imports/panels/validate`,
      timelines: runtimeEnv['ANALYSIS_STORE_TIMELINES_ENDPOINT'] || `${analysisStorePrefix}/api/timelines`,
      panels: runtimeEnv['ANALYSIS_STORE_PANELS_ENDPOINT'] || `${analysisStorePrefix}/api/panels`,
    },
  };
}

export function mergeRuntimeConfigWithDefaults(
  runtimeConfig: RuntimeConfigShape,
  defaults: AppEnvironment,
): AppEnvironment {
  return {
    production: defaults.production,
    analysisStoreDevHeadersEnabled:
      runtimeConfig.analysisStoreDevHeadersEnabled ?? defaults.analysisStoreDevHeadersEnabled,
    analysisStoreApiPrefix: runtimeConfig.analysisStoreApiPrefix ?? defaults.analysisStoreApiPrefix,
    apiAllowedPrefixes: runtimeConfig.apiAllowedPrefixes ?? defaults.apiAllowedPrefixes,
    authEndpoints: {
      login: runtimeConfig.authEndpoints?.login ?? defaults.authEndpoints.login,
      register: runtimeConfig.authEndpoints?.register ?? defaults.authEndpoints.register,
      refresh: runtimeConfig.authEndpoints?.refresh ?? defaults.authEndpoints.refresh,
      logout: runtimeConfig.authEndpoints?.logout ?? defaults.authEndpoints.logout,
      me: runtimeConfig.authEndpoints?.me ?? defaults.authEndpoints.me,
    },
    analysisStoreEndpoints: {
      importsTimelinesValidate:
        runtimeConfig.analysisStoreEndpoints?.importsTimelinesValidate ??
        defaults.analysisStoreEndpoints.importsTimelinesValidate,
      importsPanelsValidate:
        runtimeConfig.analysisStoreEndpoints?.importsPanelsValidate ??
        defaults.analysisStoreEndpoints.importsPanelsValidate,
      timelines: runtimeConfig.analysisStoreEndpoints?.timelines ?? defaults.analysisStoreEndpoints.timelines,
      panels: runtimeConfig.analysisStoreEndpoints?.panels ?? defaults.analysisStoreEndpoints.panels,
    },
  };
}
