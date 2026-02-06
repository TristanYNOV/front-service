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
        const { id: _ignoredId, ...rest } = patch;
        return { ...btn, ...rest } as SequencerBtn;
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
}
