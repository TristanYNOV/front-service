export const THEME_COLOR_HEX = {
  light: '#FAFAFA',
  dark: '#0C0C0C',
  sequencerEventBg: '#1F3D28',
  sequencerStatBg: '#1F4B73',
} as const;

export type ThemeReadableTextColor =
  | typeof THEME_COLOR_HEX.light
  | typeof THEME_COLOR_HEX.dark;
