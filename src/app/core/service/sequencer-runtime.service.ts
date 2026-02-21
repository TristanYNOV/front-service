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

  private readonly appliedLabelsByEventId = new Map<string, Set<string>>();

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

    const applyToEventsAtOwnStep = this.applyOwnFunction(btn);

    this.applyDeactivate(btn.deactivateIds ?? []);
    this.applyActivate(btn.activateIds ?? []);

    if (btn.type === 'event') {
      const labels = this.getActiveIndefiniteLabels().map(item => item.name);
      console.log(`[Sequencer] EVENT ${btn.name} TRIGGERED | LabelsActive=[${labels.join(', ')}]`);
      return;
    }

    const events = applyToEventsAtOwnStep.map(eventId => this.getBtnDisplayName(eventId));
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

  private applyOwnFunction(btn: SequencerBtn) {
    if (btn.type === 'event' && btn.eventProps.kind === 'indefinite') {
      this.toggleIndefinite(btn);
      return this.getActiveIndefiniteEvents().map(eventBtn => eventBtn.id);
    }

    if (btn.type === 'label' && btn.labelProps.mode === 'indefinite') {
      const eventsAtLabelTrigger = this.getActiveIndefiniteEvents().map(eventBtn => eventBtn.id);
      this.toggleIndefinite(btn);
      return eventsAtLabelTrigger;
    }

    if (btn.type === 'label' && btn.labelProps.mode === 'once') {
      const eventsAtLabelTrigger = this.getActiveIndefiniteEvents().map(eventBtn => eventBtn.id);
      const eventNames = eventsAtLabelTrigger.map(eventId => this.getBtnDisplayName(eventId));
      console.log(`[Sequencer] LABEL ONCE ${btn.name} TRIGGERED | ApplyToEvents=[${eventNames.join(', ')}]`);
      eventsAtLabelTrigger.forEach(eventId => this.attachLabelToEvent(eventId, btn.id));
      return eventsAtLabelTrigger;
    }

    return this.getActiveIndefiniteEvents().map(eventBtn => eventBtn.id);
  }

  private applyDeactivate(ids: string[]) {
    this.sortLinkIdsByTargetType(ids).forEach(id => {
      const target = this.panelService.getBtnById(id);
      if (!target || !this.isIndefinite(target) || !this.hasActiveId(id)) {
        return;
      }
      this.removeActiveId(id);
      this.logIndefiniteEnded(target);
    });
  }

  private applyActivate(ids: string[]) {
    this.sortLinkIdsByTargetType(ids).forEach(id => {
      const target = this.panelService.getBtnById(id);
      if (!target || !this.isIndefinite(target) || this.hasActiveId(id)) {
        return;
      }

      this.addActiveId(id);
      this.logIndefiniteStart(target);
    });
  }

  private toggleIndefinite(btn: SequencerBtn) {
    if (this.hasActiveId(btn.id)) {
      this.removeActiveId(btn.id);
      this.logIndefiniteEnded(btn);
      return;
    }

    this.addActiveId(btn.id);
    this.logIndefiniteStart(btn);
  }

  private logIndefiniteStart(btn: SequencerBtn) {
    if (btn.type === 'event') {
      console.log(`[Sequencer] EVENT INDEFINITE ${btn.name} START`);
      return;
    }
    console.log(`[Sequencer] LABEL INDEFINITE ${btn.name} START`);
  }

  private logIndefiniteEnded(btn: SequencerBtn) {
    if (btn.type === 'event') {
      const labels = this.getLabelsForEventEndLog(btn.id);
      console.log(`[Sequencer] EVENT INDEFINITE ${btn.name} ENDED | Labels=[${labels.join(', ')}]`);
      this.appliedLabelsByEventId.delete(btn.id);
      return;
    }
    console.log(`[Sequencer] LABEL INDEFINITE ${btn.name} ENDED`);
  }

  private getLabelsForEventEndLog(eventId: string) {
    const labelsOnce = [...(this.appliedLabelsByEventId.get(eventId) ?? new Set<string>())];
    const labelsIndefiniteActive = this.getActiveIndefiniteLabels().map(label => label.id);
    const uniqueLabels = [...new Set([...labelsOnce, ...labelsIndefiniteActive])];
    return uniqueLabels.map(labelId => this.getBtnDisplayName(labelId));
  }

  private attachLabelToEvent(eventId: string, labelId: string) {
    if (!this.appliedLabelsByEventId.has(eventId)) {
      this.appliedLabelsByEventId.set(eventId, new Set<string>());
    }
    this.appliedLabelsByEventId.get(eventId)?.add(labelId);
  }

  private sortLinkIdsByTargetType(ids: string[]) {
    const labelIds: string[] = [];
    const eventIds: string[] = [];

    ids.forEach(id => {
      const btn = this.panelService.getBtnById(id);
      if (!btn || !this.isIndefinite(btn)) {
        return;
      }
      if (btn.type === 'label') {
        labelIds.push(id);
        return;
      }
      eventIds.push(id);
    });

    return [...labelIds, ...eventIds];
  }

  private getBtnDisplayName(id: string) {
    return this.panelService.getBtnById(id)?.name ?? id;
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
