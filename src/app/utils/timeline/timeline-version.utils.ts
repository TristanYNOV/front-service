const SCHEMA_VERSION_REGEX = /^\d+\.\d+\.\d+$/;

export const isValidTimelineVersion = (value: string): boolean => SCHEMA_VERSION_REGEX.test(value);

export const formatTimelineVersion = (major: number, minor: number, patch: number): string =>
  `${Math.max(0, Math.floor(major))}.${Math.max(0, Math.floor(minor))}.${Math.max(0, Math.floor(patch))}`;

export const compareTimelineVersions = (a: string, b: string): number => {
  if (!isValidTimelineVersion(a) || !isValidTimelineVersion(b)) {
    throw new Error('Invalid schemaVersion');
  }
  const [am, an, ap] = a.split('.').map(Number);
  const [bm, bn, bp] = b.split('.').map(Number);
  if (am !== bm) {
    return am - bm;
  }
  if (an !== bn) {
    return an - bn;
  }
  return ap - bp;
};

export const validateTimelineSchemaVersion = (value: string): string => {
  if (!isValidTimelineVersion(value)) {
    throw new Error(`Invalid timeline schemaVersion: ${value}`);
  }
  return value;
};
