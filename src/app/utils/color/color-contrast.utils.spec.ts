import { getReadableTextColor, isLightColor } from './color-contrast.utils';

describe('color-contrast.utils', () => {
  it('detects light colors using relative luminance', () => {
    expect(isLightColor('#FFFFFF')).toBeTrue();
    expect(isLightColor('#F2D06B')).toBeTrue();
  });

  it('detects dark colors and chooses readable light text', () => {
    expect(isLightColor('#1F3D28')).toBeFalse();
    expect(getReadableTextColor('#1F3D28')).toBe('#FAFAFA');
  });

  it('falls back safely on invalid values', () => {
    expect(isLightColor('invalid')).toBeFalse();
    expect(getReadableTextColor('invalid')).toBe('#FAFAFA');
  });
});
