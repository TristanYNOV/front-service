import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HotkeysService } from '../../../core/services/hotkeys.service';
import { HotkeyChord } from '../../../interfaces/hotkey-chord.interface';
import {
  SEQUENCER_BASE_KEYS,
  SEQUENCER_MODIFIERS,
  buildChord,
  formatNormalizedHotkey,
  parseNormalizedHotkey,
} from '../../../utils/sequencer/sequencer-hotkey-options.util';

@Component({
  selector: 'app-hotkey-picker',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './hotkey-picker.component.html',
  styleUrl: './hotkey-picker.component.scss',
})
export class HotkeyPickerComponent {
  private readonly hotkeysService = inject(HotkeysService);

  @Input() set chord(value: HotkeyChord | null | undefined) {
    const parsed = value ?? null;
    this.syncFromChord(parsed);
  }
  @Input() currentActionId?: string | null;

  @Output() chordChange = new EventEmitter<HotkeyChord | null>();

  readonly baseKey = signal<string | null>(null);
  readonly modifierState = signal<Record<string, boolean>>({
    Shift: false,
    Ctrl: false,
    Alt: false,
    Meta: false,
  });

  readonly baseKeys = SEQUENCER_BASE_KEYS;
  readonly modifiers = SEQUENCER_MODIFIERS;

  readonly preview = computed(() => {
    const chord = this.buildCurrentChord();
    if (!chord) {
      return '';
    }
    const status = this.hotkeysService.isHotkeyUsed(chord);
    return formatNormalizedHotkey(status.normalized);
  });

  readonly status = computed(() => {
    const chord = this.buildCurrentChord();
    if (!chord) {
      return null;
    }
    const status = this.hotkeysService.isHotkeyUsed(chord);
    if (status.usedBy?.kind === 'sequencer' && status.usedBy.actionId === this.currentActionId) {
      return { ...status, usedBy: undefined };
    }
    return status;
  });

  onBaseKeyChange(value: string | null) {
    this.baseKey.set(value);
    this.emitCurrentChord();
  }

  toggleModifier(key: string, checked: boolean) {
    this.modifierState.set({ ...this.modifierState(), [key]: checked });
    this.emitCurrentChord();
  }

  clear() {
    this.baseKey.set(null);
    this.modifierState.set({ Shift: false, Ctrl: false, Alt: false, Meta: false });
    this.chordChange.emit(null);
  }

  formatNormalized(normalized: string) {
    return formatNormalizedHotkey(normalized);
  }

  private buildCurrentChord(): HotkeyChord | null {
    if (!this.baseKey()) {
      return null;
    }
    const modifiers = Object.entries(this.modifierState())
      .filter(([, value]) => value)
      .map(([key]) => key);
    return buildChord(this.baseKey(), modifiers);
  }

  private emitCurrentChord() {
    this.chordChange.emit(this.buildCurrentChord());
  }

  private syncFromChord(chord: HotkeyChord | null) {
    if (!chord) {
      this.baseKey.set(null);
      this.modifierState.set({ Shift: false, Ctrl: false, Alt: false, Meta: false });
      return;
    }
    const normalized = this.hotkeysService.isHotkeyUsed(chord).normalized;
    const parsed = parseNormalizedHotkey(normalized);
    if (!parsed) {
      return;
    }
    const baseKey = parsed.code ?? parsed.key ?? null;
    const modifiers = {
      Shift: !!parsed.shiftKey,
      Ctrl: !!parsed.ctrlKey,
      Alt: !!parsed.altKey,
      Meta: !!parsed.metaKey,
    };
    this.baseKey.set(baseKey);
    this.modifierState.set(modifiers);
  }
}
