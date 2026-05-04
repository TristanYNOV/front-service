import type { Counter, Gauge, Histogram, Registry } from 'prom-client';

export const SERVICE_NAME = 'front-service';

type PromClientModule = typeof import('prom-client');

let promClientPromise: Promise<PromClientModule> | null = null;
let metricsReady = false;
let register: Registry | null = null;
let httpRequestsTotal: Counter | null = null;
let httpRequestDurationSeconds: Histogram | null = null;
let httpRequestsInFlight: Gauge | null = null;
let frontSsrRenderDurationSeconds: Histogram | null = null;
let frontSsrRenderErrorsTotal: Counter | null = null;

export async function setupMetrics(): Promise<void> {
  if (metricsReady) {
    return;
  }

  const promClient = await loadPromClient();
  register = promClient.register;
  register.setDefaultLabels({ service: SERVICE_NAME });

  if (!register.getSingleMetric('process_cpu_user_seconds_total')) {
    promClient.collectDefaultMetrics({
      register,
      eventLoopMonitoringPrecision: 20,
    });
  }

  httpRequestsTotal = counter(promClient, 'http_requests_total', 'Total number of HTTP requests.', [
    'method',
    'route',
    'status_code',
  ]);
  httpRequestDurationSeconds = histogram(
    promClient,
    'http_request_duration_seconds',
    'HTTP request duration in seconds.',
    ['method', 'route', 'status_code'],
  );
  httpRequestsInFlight = gauge(
    promClient,
    'http_requests_in_flight',
    'Number of HTTP requests currently in flight.',
    ['method', 'route'],
  );
  frontSsrRenderDurationSeconds = histogram(
    promClient,
    'front_ssr_render_duration_seconds',
    'Angular SSR render duration in seconds.',
    ['result'],
  );
  frontSsrRenderErrorsTotal = counter(
    promClient,
    'front_ssr_render_errors_total',
    'Total number of Angular SSR render errors.',
    ['result', 'reason'],
  );

  metricsReady = true;
}

export async function getMetricsPayload(): Promise<{
  contentType: string;
  body: string;
}> {
  await setupMetrics();

  if (!register) {
    return { contentType: 'text/plain; version=0.0.4', body: '' };
  }

  return {
    contentType: register.contentType,
    body: await register.metrics(),
  };
}

export function incrementHttpInFlight(method: string, route: string): void {
  httpRequestsInFlight?.labels(method, route).inc();
}

export function decrementHttpInFlight(method: string, route: string): void {
  httpRequestsInFlight?.labels(method, route).dec();
}

export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: string,
  durationSeconds: number,
): void {
  httpRequestsTotal?.labels(method, route, statusCode).inc();
  httpRequestDurationSeconds
    ?.labels(method, route, statusCode)
    .observe(durationSeconds);
}

export function startSsrRenderTimer(): (labels: { result: string }) => void {
  return frontSsrRenderDurationSeconds?.startTimer() ?? (() => undefined);
}

export function recordSsrRenderError(): void {
  frontSsrRenderErrorsTotal?.labels('failure', 'unknown').inc();
}

async function loadPromClient(): Promise<PromClientModule> {
  if (!promClientPromise) {
    const dynamicImport = new Function(
      'specifier',
      'return import(specifier)',
    ) as (specifier: string) => Promise<PromClientModule>;
    promClientPromise = dynamicImport('prom-client');
  }

  return promClientPromise;
}

function counter(
  promClient: PromClientModule,
  name: string,
  help: string,
  labelNames: string[],
): Counter {
  return (
    (promClient.register.getSingleMetric(name) as Counter | undefined) ??
    new promClient.Counter({
      name,
      help,
      labelNames,
      registers: [promClient.register],
    })
  );
}

function gauge(
  promClient: PromClientModule,
  name: string,
  help: string,
  labelNames: string[],
): Gauge {
  return (
    (promClient.register.getSingleMetric(name) as Gauge | undefined) ??
    new promClient.Gauge({
      name,
      help,
      labelNames,
      registers: [promClient.register],
    })
  );
}

function histogram(
  promClient: PromClientModule,
  name: string,
  help: string,
  labelNames: string[],
): Histogram {
  return (
    (promClient.register.getSingleMetric(name) as Histogram | undefined) ??
    new promClient.Histogram({
      name,
      help,
      labelNames,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [promClient.register],
    })
  );
}
