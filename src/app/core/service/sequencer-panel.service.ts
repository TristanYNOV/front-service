import { Injectable, signal } from '@angular/core';
import { EventBtn, LabelBtn, SequencerBtn } from '../../interfaces/sequencer-btn.interface';

@Injectable({
  providedIn: 'root',
})
export class SequencerPanelService {
  private readonly panelNameSignal = signal('My Panel');
  readonly panelName = this.panelNameSignal.asReadonly();

  private readonly btnListSignal = signal<SequencerBtn[]>([]);
  readonly btnList = this.btnListSignal.asReadonly();

  private readonly editModeSignal = signal(false);
  readonly editMode = this.editModeSignal.asReadonly();

  setPanelName(name: string) {
    this.panelNameSignal.set(name.trim() || 'My Panel');
  }

  setEditMode(next: boolean) {
    this.editModeSignal.set(next);
  }

  toggleEditMode() {
    this.editModeSignal.set(!this.editModeSignal());
  }

  addEventBtn(payload: Omit<EventBtn, 'type'>): EventBtn | null {
    const id = payload.id.trim();
    if (!this.isIdAvailable(id)) {
      return null;
    }
    const newBtn: EventBtn = {
      ...payload,
      id,
      type: 'event',
      deactivateIds: this.normalizeLinkIds(payload.deactivateIds),
      activateIds: this.normalizeLinkIds(payload.activateIds),
    };
    this.btnListSignal.set([...this.btnListSignal(), newBtn]);
    return newBtn;
  }

  addLabelBtn(payload: Omit<LabelBtn, 'type'>): LabelBtn | null {
    const id = payload.id.trim();
    if (!this.isIdAvailable(id)) {
      return null;
    }
    const newBtn: LabelBtn = {
      ...payload,
      id,
      type: 'label',
      deactivateIds: this.normalizeLinkIds(payload.deactivateIds),
      activateIds: this.normalizeLinkIds(payload.activateIds),
    };
    this.btnListSignal.set([...this.btnListSignal(), newBtn]);
    return newBtn;
  }

  updateBtn(id: string, patch: Partial<SequencerBtn>) {
    const trimmedId = id.trim();
    if (!trimmedId) {
      return;
    }
    this.btnListSignal.set(
      this.btnListSignal().map(btn => {
        if (btn.id !== trimmedId) {
          return btn;
        }
        const rest = { ...patch };
        delete rest.id;
        return {
          ...btn,
          ...rest,
          deactivateIds: this.normalizeLinkIds(rest.deactivateIds ?? btn.deactivateIds),
          activateIds: this.normalizeLinkIds(rest.activateIds ?? btn.activateIds),
        } as SequencerBtn;
      }),
    );
  }

  removeBtn(id: string) {
    const trimmedId = id.trim();
    if (!trimmedId) {
      return;
    }
    this.btnListSignal.set(this.btnListSignal().filter(btn => btn.id !== trimmedId));
  }

  isIdAvailable(id: string) {
    const trimmed = id.trim();
    if (!trimmed) {
      return false;
    }
    return !this.btnListSignal().some(btn => btn.id.toLowerCase() === trimmed.toLowerCase());
  }

  getBtnById(id: string) {
    return this.btnListSignal().find(btn => btn.id === id);
  }

  getAllBtnIds() {
    return this.btnListSignal().map(btn => btn.id);
  }

  getBtnLabel(id: string) {
    return this.getBtnById(id)?.name ?? id;
  }

  private normalizeLinkIds(ids?: string[]) {
    if (!ids?.length) {
      return [];
    }
    return [...new Set(ids.map(id => id.trim()).filter(Boolean))];
  }
}
