import { HotkeyChord } from '../../interfaces/hotkey-chord.interface';

const LETTER_BASE_KEYS = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode(65 + index),
);

export const SEQUENCER_BASE_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  ...LETTER_BASE_KEYS,
] as const;
export const SEQUENCER_MODIFIERS = ['Shift', 'Ctrl', 'Alt', 'Meta'] as const;

export const buildChord = (baseKey: string | null, modifiers: string[]): HotkeyChord => {
  if (!baseKey) {
    return {};
  }
  const isLetter = /^[A-Z]$/.test(baseKey);
  const key = baseKey.startsWith('Digit') ? baseKey.replace('Digit', '') : baseKey;
  const code = isLetter ? `Key${baseKey}` : baseKey;
  return {
    key,
    code,
    shiftKey: modifiers.includes('Shift'),
    ctrlKey: modifiers.includes('Ctrl'),
    altKey: modifiers.includes('Alt'),
    metaKey: modifiers.includes('Meta'),
  };
};

export const formatNormalizedHotkey = (normalized?: string | null): string => {
  if (!normalized) {
    return '';
  }
  const parts = normalized.split('+');
  const baseKey = parts.pop() ?? '';
  const baseLabel = baseKey.startsWith('Digit') ? baseKey.replace('Digit', '') : baseKey;
  return [...parts, baseLabel].filter(Boolean).join('+');
};

export const parseNormalizedHotkey = (normalized?: string | null): HotkeyChord | null => {
  if (!normalized) {
    return null;
  }
  const parts = normalized.split('+').filter(Boolean);
  if (!parts.length) {
    return null;
  }
  const baseKey = parts.pop() ?? '';
  const modifiers = parts;
  return buildChord(baseKey, modifiers);
};
