import { environment } from '../../../environments/environment';
import { AppEnvironment } from '../../../environments/environment.model';

type RuntimeConfigShape = Partial<Omit<AppEnvironment, 'production'>>;

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfigShape;
  }
}

function parseCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return parsed.length > 0 ? parsed : fallback;
}

function readBrowserRuntimeConfig(): RuntimeConfigShape {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__RUNTIME_CONFIG__ ?? {};
}

function readServerRuntimeConfig(): RuntimeConfigShape {
  if (typeof process === 'undefined') {
    return {};
  }

  const authPrefix = process.env['AUTH_API_PREFIX']?.trim() || '';
  const analysisStorePrefix = process.env['ANALYSIS_STORE_API_PREFIX']?.trim() || '';

  return {
    apiAllowedPrefixes: parseCsv(process.env['API_ALLOWED_PREFIXES'], environment.apiAllowedPrefixes),
    authEndpoints: {
      login: process.env['AUTH_LOGIN_ENDPOINT'] || `${authPrefix}/auth/login`,
      register: process.env['AUTH_REGISTER_ENDPOINT'] || `${authPrefix}/users`,
      refresh: process.env['AUTH_REFRESH_ENDPOINT'] || `${authPrefix}/auth/refresh`,
      logout: process.env['AUTH_LOGOUT_ENDPOINT'] || `${authPrefix}/auth/logout`,
      me: process.env['AUTH_ME_ENDPOINT'] || `${authPrefix}/me`,
    },
    analysisStoreEndpoints: {
      importsTimelinesValidate:
        process.env['ANALYSIS_STORE_IMPORTS_TIMELINES_VALIDATE_ENDPOINT'] ||
        `${analysisStorePrefix}/api/imports/timelines/validate`,
      importsPanelsValidate:
        process.env['ANALYSIS_STORE_IMPORTS_PANELS_VALIDATE_ENDPOINT'] ||
        `${analysisStorePrefix}/api/imports/panels/validate`,
      timelines: process.env['ANALYSIS_STORE_TIMELINES_ENDPOINT'] || `${analysisStorePrefix}/api/timelines`,
      panels: process.env['ANALYSIS_STORE_PANELS_ENDPOINT'] || `${analysisStorePrefix}/api/panels`,
    },
  };
}

function mergeWithDefaults(runtimeConfig: RuntimeConfigShape): AppEnvironment {
  return {
    production: environment.production,
    apiAllowedPrefixes: runtimeConfig.apiAllowedPrefixes ?? environment.apiAllowedPrefixes,
    authEndpoints: {
      login: runtimeConfig.authEndpoints?.login ?? environment.authEndpoints.login,
      register: runtimeConfig.authEndpoints?.register ?? environment.authEndpoints.register,
      refresh: runtimeConfig.authEndpoints?.refresh ?? environment.authEndpoints.refresh,
      logout: runtimeConfig.authEndpoints?.logout ?? environment.authEndpoints.logout,
      me: runtimeConfig.authEndpoints?.me ?? environment.authEndpoints.me,
    },
    analysisStoreEndpoints: {
      importsTimelinesValidate:
        runtimeConfig.analysisStoreEndpoints?.importsTimelinesValidate ??
        environment.analysisStoreEndpoints.importsTimelinesValidate,
      importsPanelsValidate:
        runtimeConfig.analysisStoreEndpoints?.importsPanelsValidate ??
        environment.analysisStoreEndpoints.importsPanelsValidate,
      timelines: runtimeConfig.analysisStoreEndpoints?.timelines ?? environment.analysisStoreEndpoints.timelines,
      panels: runtimeConfig.analysisStoreEndpoints?.panels ?? environment.analysisStoreEndpoints.panels,
    },
  };
}

const runtimeConfig = typeof window === 'undefined' ? readServerRuntimeConfig() : readBrowserRuntimeConfig();

export const runtimeEnvironment: AppEnvironment = mergeWithDefaults(runtimeConfig);
