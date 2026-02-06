import { Injectable, inject, signal } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { VideoService } from './video.service';
import { HotkeyChord } from '../../interfaces/hotkey-chord.interface';
import { SEQUENCER_BASE_KEYS } from '../../utils/sequencer/sequencer-hotkey-options.util';
import { SequencerPanelService } from '../service/sequencer-panel.service';

export type HotkeySourceKind = 'reserved' | 'sequencer';

export type { HotkeyChord };

export type RegisterHotkeyResult =
  | { ok: true; normalized: string }
  | {
      ok: false;
      errorCode: 'RESERVED_HOTKEY' | 'ALREADY_USED' | 'INVALID_CHORD';
      normalized: string;
      usedBy?: { kind: HotkeySourceKind; label?: string };
    };

export interface SequencerHotkeyEntry {
  normalized: string;
  actionId: string;
  label?: string;
}

export interface UsedHotkeyEntry {
  normalized: string;
  kind: HotkeySourceKind;
  label?: string;
  actionId?: string;
}

interface HotkeyBinding {
  normalized: string;
  handler: () => void;
  allowRepeat?: boolean;
  label?: string;
}

interface SequencerBinding extends HotkeyBinding {
  actionId: string;
}

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);
const NON_CHARACTER_CODES = new Set(['Space', 'ArrowLeft', 'ArrowRight']);
const CODE_PREFIXES = ['Digit', 'Numpad'];

@Injectable({
  providedIn: 'root',
})
export class HotkeysService {
  private readonly videoService = inject(VideoService);
  private readonly sequencerPanelService = inject(SequencerPanelService);
  private readonly enabledSignal = signal(false);
  readonly enabled = this.enabledSignal.asReadonly();

  private subscription?: Subscription;
  private readonly reservedBindings = new Map<string, HotkeyBinding>();
  private readonly sequencerBindings = new Map<string, SequencerBinding>();
  private readonly actionBindings = new Map<string, string>();
  private readonly sequencerBaseKeys = new Set<string>(SEQUENCER_BASE_KEYS);

  enable() {
    if (this.subscription) {
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    this.enabledSignal.set(true);
    this.subscription = fromEvent<KeyboardEvent>(document, 'keydown').subscribe(event => {
      this.handleKeydown(event);
    });
  }

  disable() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.enabledSignal.set(false);
  }

  initReservedVideoHotkeys() {
    this.reservedBindings.clear();
    this.registerReserved(
      { key: ' ', code: 'Space' },
      () => this.videoService.togglePlayPause(),
      { label: 'Play/Pause', allowRepeat: false },
    );
    this.registerReserved(
      { key: 'ArrowLeft', code: 'ArrowLeft' },
      () => this.videoService.seekMs(this.videoService.nowMs() - 1000),
      { label: 'Reculer 1s', allowRepeat: true },
    );
    this.registerReserved(
      { key: 'ArrowRight', code: 'ArrowRight' },
      () => this.videoService.seekMs(this.videoService.nowMs() + 1000),
      { label: 'Avancer 1s', allowRepeat: true },
    );
    this.registerReserved(
      { key: ',', code: 'Comma' },
      () => this.videoService.stepFrames(-1),
      { label: 'Frame -1', allowRepeat: true },
    );
    this.registerReserved(
      { key: '.', code: 'Period' },
      () => this.videoService.stepFrames(1),
      { label: 'Frame +1', allowRepeat: true },
    );
    this.registerReserved(
      { key: '/', code: 'Slash' },
      () => this.videoService.setRate(this.videoService.playbackRate() + 0.25),
      { label: 'Vitesse +', allowRepeat: true },
    );
    this.registerReserved(
      { key: '-', code: 'Minus' },
      () => this.videoService.setRate(this.videoService.playbackRate() - 0.25),
      { label: 'Vitesse -', allowRepeat: true },
    );
  }

  registerSequencerHotkey(
    chord: HotkeyChord,
    actionId: string,
    handler: () => void,
    options?: { label?: string; allowRepeat?: boolean },
  ): RegisterHotkeyResult {
    const normalization = this.normalizeChord(chord);
    if (!normalization.isValid || !this.isSequencerChordAllowed(normalization.baseKey)) {
      return {
        ok: false,
        errorCode: 'INVALID_CHORD',
        normalized: normalization.normalized,
      };
    }

    if (this.reservedBindings.has(normalization.normalized)) {
      const binding = this.reservedBindings.get(normalization.normalized);
      return {
        ok: false,
        errorCode: 'RESERVED_HOTKEY',
        normalized: normalization.normalized,
        usedBy: { kind: 'reserved', label: binding?.label },
      };
    }

    const existingSequencer = this.sequencerBindings.get(normalization.normalized);
    if (existingSequencer && existingSequencer.actionId !== actionId) {
      return {
        ok: false,
        errorCode: 'ALREADY_USED',
        normalized: normalization.normalized,
        usedBy: { kind: 'sequencer', label: existingSequencer.label },
      };
    }

    const existingBinding = this.actionBindings.get(actionId);
    if (existingBinding && existingBinding !== normalization.normalized) {
      this.sequencerBindings.delete(existingBinding);
      this.actionBindings.delete(actionId);
    }

    const binding: SequencerBinding = {
      normalized: normalization.normalized,
      actionId,
      handler,
      allowRepeat: options?.allowRepeat,
      label: options?.label,
    };
    this.sequencerBindings.set(normalization.normalized, binding);
    this.actionBindings.set(actionId, normalization.normalized);

    return { ok: true, normalized: normalization.normalized };
  }

  unassignSequencerHotkey(chord: HotkeyChord): boolean {
    const normalization = this.normalizeChord(chord);
    if (!normalization.normalized) {
      return false;
    }
    const binding = this.sequencerBindings.get(normalization.normalized);
    if (!binding) {
      return false;
    }
    this.sequencerBindings.delete(normalization.normalized);
    this.actionBindings.delete(binding.actionId);
    return true;
  }

  unassignSequencerHotkeyByAction(actionId: string): boolean {
    const binding = this.actionBindings.get(actionId);
    if (!binding) {
      return false;
    }
    this.sequencerBindings.delete(binding);
    this.actionBindings.delete(actionId);
    return true;
  }

  clearSequencerHotkeys() {
    this.sequencerBindings.clear();
    this.actionBindings.clear();
  }

  getUsedHotkeys(): UsedHotkeyEntry[] {
    const reserved = Array.from(this.reservedBindings.values()).map(binding => ({
      normalized: binding.normalized,
      kind: 'reserved' as const,
      label: binding.label,
    }));
    const sequencer = Array.from(this.sequencerBindings.values()).map(binding => ({
      normalized: binding.normalized,
      kind: 'sequencer' as const,
      label: binding.label,
      actionId: binding.actionId,
    }));
    return [...reserved, ...sequencer];
  }

  getSequencerHotkeys(): SequencerHotkeyEntry[] {
    return Array.from(this.sequencerBindings.values()).map(binding => ({
      normalized: binding.normalized,
      actionId: binding.actionId,
      label: binding.label,
    }));
  }

  isHotkeyUsed(chord: HotkeyChord): { normalized: string; isValid: boolean; usedBy?: UsedHotkeyEntry } {
    const normalization = this.normalizeChord(chord);
    const isValid = normalization.isValid && this.isSequencerChordAllowed(normalization.baseKey);
    if (!normalization.normalized) {
      return { normalized: normalization.normalized, isValid };
    }
    if (!isValid) {
      return { normalized: normalization.normalized, isValid };
    }
    const reserved = this.reservedBindings.get(normalization.normalized);
    if (reserved) {
      return {
        normalized: normalization.normalized,
        isValid,
        usedBy: {
          normalized: normalization.normalized,
          kind: 'reserved',
          label: reserved.label,
        },
      };
    }
    const sequencer = this.sequencerBindings.get(normalization.normalized);
    if (sequencer) {
      return {
        normalized: normalization.normalized,
        isValid,
        usedBy: {
          normalized: normalization.normalized,
          kind: 'sequencer',
          label: sequencer.label,
          actionId: sequencer.actionId,
        },
      };
    }
    return { normalized: normalization.normalized, isValid };
  }

  private handleKeydown(event: KeyboardEvent) {
    if (!this.enabledSignal()) {
      return;
    }

    if (this.shouldIgnoreEvent(event)) {
      return;
    }

    const normalization = this.normalizeChord({
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    });

    if (!normalization.isValid) {
      return;
    }

    const sequencerBinding = this.sequencerPanelService.editMode()
      ? undefined
      : this.sequencerBindings.get(normalization.normalized);
    const reservedBinding = this.reservedBindings.get(normalization.normalized);
    const binding = sequencerBinding ?? reservedBinding;

    if (!binding) {
      return;
    }

    if (event.repeat && binding.allowRepeat === false) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    binding.handler();
  }

  private shouldIgnoreEvent(event: KeyboardEvent) {
    return this.isTextInputTarget(event.target) || this.isTextInputActive();
  }

  private isTextInputActive() {
    if (typeof document === 'undefined') {
      return false;
    }
    const activeElement = document.activeElement;
    return this.isTextInputTarget(activeElement);
  }

  private isTextInputTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }
    return target.isContentEditable;
  }

  private normalizeChord(chord: HotkeyChord): { normalized: string; isValid: boolean; baseKey: string } {
    const normalizedKey = this.resolveBaseKey(chord);
    const modifiers = this.resolveModifiers(chord);
    const parts = [...modifiers];
    if (normalizedKey) {
      parts.push(normalizedKey);
    }
    const normalized = parts.join('+');
    if (!normalizedKey) {
      return { normalized, isValid: false, baseKey: normalizedKey };
    }
    if (this.isModifierKey(normalizedKey, chord.code ?? undefined)) {
      return { normalized, isValid: false, baseKey: normalizedKey };
    }
    return { normalized, isValid: true, baseKey: normalizedKey };
  }

  private resolveBaseKey(chord: HotkeyChord): string {
    const code = chord.code ?? undefined;
    const key = chord.key ?? undefined;
    if (code && (NON_CHARACTER_CODES.has(code) || this.isDigitCode(code) || this.isNumpadCode(code))) {
      return code;
    }
    if (key) {
      if (this.isSingleDigit(key)) {
        return `Digit${key}`;
      }
      if (key.length === 1) {
        return key.toUpperCase();
      }
      return key;
    }
    if (code) {
      return code;
    }
    return '';
  }

  private isSequencerChordAllowed(baseKey: string) {
    if (!baseKey) {
      return false;
    }
    return this.sequencerBaseKeys.has(baseKey);
  }

  private resolveModifiers(chord: HotkeyChord) {
    const modifiers: string[] = [];
    if (chord.ctrlKey) {
      modifiers.push('Ctrl');
    }
    if (chord.altKey) {
      modifiers.push('Alt');
    }
    if (chord.shiftKey) {
      modifiers.push('Shift');
    }
    if (chord.metaKey) {
      modifiers.push('Meta');
    }
    return modifiers;
  }

  private isDigitCode(code: string) {
    return CODE_PREFIXES.some(prefix => code.startsWith(prefix));
  }

  private isNumpadCode(code: string) {
    return code.startsWith('Numpad');
  }

  private isSingleDigit(key: string) {
    return /^[0-9]$/.test(key);
  }

  private isModifierKey(normalizedKey: string, code?: string) {
    if (MODIFIER_KEYS.has(normalizedKey)) {
      return true;
    }
    if (!code) {
      return false;
    }
    return code.startsWith('Shift') || code.startsWith('Control') || code.startsWith('Alt') || code.startsWith('Meta');
  }

  private registerReserved(
    chord: HotkeyChord,
    handler: () => void,
    options?: { label?: string; allowRepeat?: boolean },
  ) {
    const normalization = this.normalizeChord(chord);
    if (!normalization.isValid) {
      return;
    }
    this.reservedBindings.set(normalization.normalized, {
      normalized: normalization.normalized,
      handler,
      allowRepeat: options?.allowRepeat,
      label: options?.label,
    });
  }
}
