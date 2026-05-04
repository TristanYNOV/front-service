import { NextFunction, Request, Response } from 'express';
import {
  decrementHttpInFlight,
  incrementHttpInFlight,
  recordHttpRequest,
} from './metrics';

type RequestWithRoute = Request & {
  route?: {
    path?: string | RegExp | (string | RegExp)[];
  };
};

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const method = req.method;
  const inFlightRoute = '/pending';
  const start = process.hrtime.bigint();

  incrementHttpInFlight(method, inFlightRoute);

  res.once('finish', () => {
    const route = normalizeRoute(req);
    const statusCode = String(res.statusCode);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    decrementHttpInFlight(method, inFlightRoute);
    recordHttpRequest(method, route, statusCode, durationSeconds);
  });

  next();
}

function normalizeRoute(req: RequestWithRoute): string {
  const routePath = toRoutePath(req.route?.path);
  if (routePath) {
    return normalizePath(routePath);
  }

  return '/unmatched';
}

function toRoutePath(
  routePath?: string | RegExp | (string | RegExp)[],
): string | null {
  if (Array.isArray(routePath)) {
    return toRoutePath(routePath[0]);
  }

  if (typeof routePath === 'string') {
    return routePath;
  }

  return null;
}

function normalizePath(path: string): string {
  if (path === '**') {
    return '/**';
  }

  const withoutQuery = path.split('?')[0] || '/';
  const normalized = withoutQuery
    .replace(UUID_PATTERN, ':id')
    .replace(/\/+/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
