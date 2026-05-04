import { environment } from '../../../environments/environment';
import { AppEnvironment } from '../../../environments/environment.model';
import {
  buildRuntimeConfigFromEnv,
  mergeRuntimeConfigWithDefaults,
  RuntimeConfigShape,
} from './runtime-config-builder';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfigShape;
  }
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

  return buildRuntimeConfigFromEnv(process.env, environment);
}

const runtimeConfig = typeof window === 'undefined' ? readServerRuntimeConfig() : readBrowserRuntimeConfig();

export const runtimeEnvironment: AppEnvironment = mergeRuntimeConfigWithDefaults(runtimeConfig, environment);
