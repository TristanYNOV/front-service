import { compareTimelineVersions, formatTimelineVersion, isValidTimelineVersion, validateTimelineSchemaVersion } from './timeline-version.utils';

describe('timeline-version.utils', () => {
  it('validates strict semver-like versions', () => {
    expect(isValidTimelineVersion('1.0.0')).toBeTrue();
    expect(isValidTimelineVersion('1.0')).toBeFalse();
    expect(isValidTimelineVersion('v1.0.0')).toBeFalse();
  });

  it('formats and compares versions', () => {
    expect(formatTimelineVersion(1, 2, 3)).toBe('1.2.3');
    expect(compareTimelineVersions('1.2.0', '1.1.9')).toBeGreaterThan(0);
    expect(compareTimelineVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('throws on invalid version validation', () => {
    expect(() => validateTimelineSchemaVersion('1')).toThrow();
  });
});
