import { Injectable, inject, signal } from '@angular/core';
import { SequencerPanelService } from './sequencer-panel.service';

export interface SequencerTriggerEntry {
  timestamp: number;
  source: 'hotkey' | 'click';
  btnId: string;
  name: string;
  normalizedHotkey?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SequencerRuntimeService {
  private readonly panelService = inject(SequencerPanelService);

  private readonly triggerCountByBtnIdSignal = signal<Record<string, number>>({});
  readonly triggerCountByBtnId = this.triggerCountByBtnIdSignal.asReadonly();

  private readonly lastTriggeredBtnIdSignal = signal<string | null>(null);
  readonly lastTriggeredBtnId = this.lastTriggeredBtnIdSignal.asReadonly();

  private readonly recentTriggersSignal = signal<SequencerTriggerEntry[]>([]);
  readonly recentTriggers = this.recentTriggersSignal.asReadonly();

  private lastTriggerTimeout?: ReturnType<typeof setTimeout>;

  trigger(btnId: string, source: 'hotkey' | 'click') {
    const btn = this.panelService.btnList().find(item => item.id === btnId);
    if (!btn) {
      return;
    }

    const counts = { ...this.triggerCountByBtnIdSignal() };
    counts[btnId] = (counts[btnId] ?? 0) + 1;
    this.triggerCountByBtnIdSignal.set(counts);

    const entry: SequencerTriggerEntry = {
      timestamp: Date.now(),
      source,
      btnId,
      name: btn.name,
      normalizedHotkey: btn.hotkeyNormalized,
    };
    const updated = [entry, ...this.recentTriggersSignal()].slice(0, 10);
    this.recentTriggersSignal.set(updated);

    this.lastTriggeredBtnIdSignal.set(btnId);
    if (this.lastTriggerTimeout) {
      clearTimeout(this.lastTriggerTimeout);
    }
    this.lastTriggerTimeout = setTimeout(() => {
      if (this.lastTriggeredBtnIdSignal() === btnId) {
        this.lastTriggeredBtnIdSignal.set(null);
      }
    }, 200);
  }
}
