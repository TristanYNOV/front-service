const HEX_COLOR_REGEX = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(hex: string): string | null {
  const value = hex.trim();
  if (!HEX_COLOR_REGEX.test(value)) {
    return null;
  }
  return value.startsWith('#') ? value.toUpperCase() : `#${value.toUpperCase()}`;
}

function srgbToLinear(channel: number): number {
  const normalized = channel / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number | null {
  const normalizedHex = normalizeHex(hex);
  if (!normalizedHex) {
    return null;
  }

  const r = Number.parseInt(normalizedHex.slice(1, 3), 16);
  const g = Number.parseInt(normalizedHex.slice(3, 5), 16);
  const b = Number.parseInt(normalizedHex.slice(5, 7), 16);

  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function isLightColor(hex: string): boolean {
  const luminance = relativeLuminance(hex);
  if (luminance === null) {
    return false;
  }
  return luminance > 0.179;
}

export function getReadableTextColor(hex: string): '#FAFAFA' | '#0C0C0C' {
  return isLightColor(hex) ? '#0C0C0C' : '#FAFAFA';
}
