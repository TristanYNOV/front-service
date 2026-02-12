import { Injectable, inject, signal } from '@angular/core';
import { SequencerPanelService } from './sequencer-panel.service';
import { SequencerBtn } from '../../interfaces/sequencer-btn.interface';

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

  private readonly activeIndefiniteIdsSignal = signal<string[]>([]);
  readonly activeIndefiniteIds = this.activeIndefiniteIdsSignal.asReadonly();

  private lastTriggerTimeout?: ReturnType<typeof setTimeout>;

  trigger(btnId: string, source: 'hotkey' | 'click') {
    const btn = this.panelService.getBtnById(btnId);
    if (!btn || this.panelService.editMode()) {
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

    if (this.isIndefinite(btn)) {
      this.toggleIndefinite(btn);
    }

    this.applyDeactivate(btn.deactivateIds ?? []);
    this.applyActivate(btn.activateIds ?? []);

    if (btn.type === 'event') {
      const labels = this.getActiveIndefiniteLabels().map(item => item.name);
      console.log(`[Sequencer] EVENT ${btn.name} TRIGGERED | LabelsActive=[${labels.join(', ')}]`);
      return;
    }

    const events = this.getActiveIndefiniteEvents().map(item => item.name);
    console.log(`[Sequencer] LABEL ${btn.name} TRIGGERED | ApplyToEvents=[${events.join(', ')}]`);
  }

  isBtnActive(btnId: string) {
    return this.hasActiveId(btnId);
  }

  private isIndefinite(btn: SequencerBtn) {
    return (
      (btn.type === 'event' && btn.eventProps.kind === 'indefinite') ||
      (btn.type === 'label' && btn.labelProps.mode === 'indefinite')
    );
  }

  private getActiveIndefiniteLabels() {
    const ids = new Set(this.activeIndefiniteIdsSignal());
    return this.panelService
      .btnList()
      .filter(btn => btn.type === 'label' && btn.labelProps.mode === 'indefinite' && ids.has(btn.id));
  }

  private getActiveIndefiniteEvents() {
    const ids = new Set(this.activeIndefiniteIdsSignal());
    return this.panelService
      .btnList()
      .filter(btn => btn.type === 'event' && btn.eventProps.kind === 'indefinite' && ids.has(btn.id));
  }

  private applyDeactivate(ids: string[]) {
    ids.forEach(id => {
      const target = this.panelService.getBtnById(id);
      if (!target || !this.isIndefinite(target)) {
        return;
      }
      this.removeActiveId(id);
    });
  }

  private applyActivate(ids: string[]) {
    ids.forEach(id => {
      const target = this.panelService.getBtnById(id);
      if (!target || !this.isIndefinite(target)) {
        return;
      }
      this.addActiveId(id);
    });
  }

  private toggleIndefinite(btn: SequencerBtn) {
    if (this.hasActiveId(btn.id)) {
      this.removeActiveId(btn.id);
      if (btn.type === 'event') {
        const labels = this.getActiveIndefiniteLabels().map(item => item.name);
        console.log(`[Sequencer] EVENT INDEFINITE ${btn.name} ENDED | Labels=[${labels.join(', ')}]`);
      } else {
        console.log(`[Sequencer] LABEL INDEFINITE ${btn.name} ENDED`);
      }
      return;
    }

    this.addActiveId(btn.id);
    if (btn.type === 'event') {
      console.log(`[Sequencer] EVENT INDEFINITE ${btn.name} START`);
      return;
    }

    console.log(`[Sequencer] LABEL INDEFINITE ${btn.name} START`);
  }

  private addActiveId(id: string) {
    if (this.hasActiveId(id)) {
      return;
    }
    this.activeIndefiniteIdsSignal.set([...this.activeIndefiniteIdsSignal(), id]);
  }

  private removeActiveId(id: string) {
    if (!this.hasActiveId(id)) {
      return;
    }
    this.activeIndefiniteIdsSignal.set(this.activeIndefiniteIdsSignal().filter(item => item !== id));
  }

  private hasActiveId(id: string) {
    return this.activeIndefiniteIdsSignal().includes(id);
  }
}
