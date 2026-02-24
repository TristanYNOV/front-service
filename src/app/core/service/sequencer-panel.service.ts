import { Injectable, signal } from '@angular/core';
import { EventBtn, LabelBtn, SequencerBtn } from '../../interfaces/sequencer-btn.interface';
import { SequencerBtnLayout } from '../../interfaces/sequencer-btn-layout.interface';
import {
  defaultButtonHeightPx,
  defaultButtonWidthPx,
  minButtonHeightPx,
  minButtonWidthPx,
  placementSpiral,
} from '../../utils/sequencer/sequencer-canvas-defaults.util';

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

  private zCounter = 0;

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
    newBtn.layout = this.ensureLayout(newBtn);
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
    newBtn.layout = this.ensureLayout(newBtn);
    this.btnListSignal.set([...this.btnListSignal(), newBtn]);
    return newBtn;
  }

  ensureAllLayouts() {
    let changed = false;
    const next = this.btnListSignal().map(btn => {
      const ensuredLayout = this.ensureLayout(btn);
      if (btn.layout === ensuredLayout) {
        return btn;
      }
      changed = true;
      return { ...btn, layout: ensuredLayout };
    });
    if (changed) {
      this.btnListSignal.set(next);
    }
  }

  ensureLayout(btn: SequencerBtn): SequencerBtnLayout {
    if (btn.layout) {
      const normalized = this.normalizeLayout(btn.layout);
      this.zCounter = Math.max(this.zCounter, normalized.z ?? 0);
      return normalized;
    }

    return this.computeSpawnLayout(btn.id);
  }

  updateLayout(id: string, patch: Partial<SequencerBtnLayout>) {
    const trimmedId = id.trim();
    if (!trimmedId) {
      return;
    }

    this.btnListSignal.set(
      this.btnListSignal().map(btn => {
        if (btn.id !== trimmedId) {
          return btn;
        }
        const baseLayout = this.ensureLayout(btn);
        const merged = this.normalizeLayout({ ...baseLayout, ...patch });
        this.zCounter = Math.max(this.zCounter, merged.z ?? 0);
        return { ...btn, layout: merged };
      }),
    );
  }

  bringBtnToFront(id: string) {
    this.updateLayout(id, { z: this.nextZIndex() });
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

  private nextZIndex() {
    this.zCounter += 1;
    return this.zCounter;
  }

  private normalizeLayout(layout: SequencerBtnLayout): SequencerBtnLayout {
    return {
      x: Math.round(layout.x),
      y: Math.round(layout.y),
      w: Math.max(minButtonWidthPx, Math.round(layout.w)),
      h: Math.max(minButtonHeightPx, Math.round(layout.h)),
      z: layout.z ?? this.nextZIndex(),
    };
  }

  private computeSpawnLayout(btnId: string): SequencerBtnLayout {
    const spawnCandidates = this.generateSpiralCandidates();
    const existing = this.btnListSignal().map(item => item.layout).filter((layout): layout is SequencerBtnLayout => !!layout);

    for (let i = 0; i < Math.min(spawnCandidates.length, placementSpiral.maxAttempts); i += 1) {
      const point = spawnCandidates[i];
      const candidate = this.normalizeLayout({
        x: point.x,
        y: point.y,
        w: defaultButtonWidthPx,
        h: defaultButtonHeightPx,
      });
      const collides = existing.some(layout => this.layoutsOverlap(layout, candidate));
      if (!collides) {
        return candidate;
      }
    }

    const fallbackPoint = spawnCandidates[placementSpiral.maxAttempts - 1] ?? { x: 16, y: 16 };
    console.warn(`[Sequencer] Spawn fallback used for ${btnId}`);
    return this.normalizeLayout({
      x: fallbackPoint.x,
      y: fallbackPoint.y,
      w: defaultButtonWidthPx,
      h: defaultButtonHeightPx,
    });
  }

  private layoutsOverlap(a: SequencerBtnLayout, b: SequencerBtnLayout) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private generateSpiralCandidates() {
    const points: { x: number; y: number }[] = [{ x: 16, y: 16 }];
    let x = 0;
    let y = 0;
    let stepLength = 1;
    const step = placementSpiral.stepPx;
    const directions: [number, number][] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];

    while (points.length < placementSpiral.maxAttempts) {
      for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
        const [dx, dy] = directions[directionIndex];
        for (let i = 0; i < stepLength; i += 1) {
          x += dx * step;
          y += dy * step;
          points.push({ x: 16 + x, y: 16 + y });
          if (points.length >= placementSpiral.maxAttempts) {
            return points;
          }
        }
        if (directionIndex % 2 === 1) {
          stepLength += 1;
        }
      }
    }

    return points;
  }
}
