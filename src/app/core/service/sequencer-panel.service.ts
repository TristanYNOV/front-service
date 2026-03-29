import { Injectable, computed, signal } from '@angular/core';
import {
  EventBtn,
  LabelBtn,
  SequencerBtn,
  SequencerStatDefinition,
  SequencerStatEditorTerm,
  SequencerStatExpressionToken,
  SequencerStatNode,
  SequencerStatQuery,
  StatBtn,
} from '../../interfaces/sequencer-btn.interface';
import { SequencerBtnLayout } from '../../interfaces/sequencer-btn-layout.interface';
import {
  defaultButtonHeightPx,
  defaultButtonWidthPx,
  minButtonHeightPx,
  minButtonWidthPx,
  placementSpiral,
} from '../../utils/sequencer/sequencer-canvas-defaults.util';

interface SequencerPanelDocument {
  panelName: string;
  btnList: SequencerBtn[];
}

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
  readonly panel = computed(() => ({
    panelName: this.panelNameSignal(),
    btnList: this.btnListSignal(),
  }));

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

  addStatBtn(payload: Omit<StatBtn, 'type'>): StatBtn | null {
    const id = payload.id.trim();
    if (!this.isIdAvailable(id)) {
      return null;
    }
    const newBtn: StatBtn = {
      ...payload,
      id,
      type: 'stat',
      deactivateIds: this.normalizeLinkIds(payload.deactivateIds),
      activateIds: this.normalizeLinkIds(payload.activateIds),
    };
    newBtn.layout = this.ensureLayout(newBtn);
    this.btnListSignal.set([...this.btnListSignal(), newBtn]);
    return newBtn;
  }

  exportAsJson(): string {
    const document: SequencerPanelDocument = {
      panelName: this.panelNameSignal(),
      btnList: this.btnListSignal(),
    };
    return JSON.stringify(document, null, 2);
  }

  importFromJson(rawJson: string): boolean {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!isSequencerPanelDocument(parsed)) {
      return false;
    }

    this.panelNameSignal.set(parsed.panelName.trim() || 'My Panel');
    this.btnListSignal.set(parsed.btnList.map(btn => ({ ...btn, layout: this.ensureLayout(btn) })));
    return true;
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

function isSequencerPanelDocument(value: unknown): value is SequencerPanelDocument {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SequencerPanelDocument>;
  if (typeof candidate.panelName !== 'string' || !Array.isArray(candidate.btnList)) {
    return false;
  }

  return candidate.btnList.every(isSequencerBtn);
}

function isSequencerBtn(value: unknown): value is SequencerBtn {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SequencerBtn>;
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
    return false;
  }

  if (candidate.type === 'event') {
    return !!candidate.eventProps;
  }
  if (candidate.type === 'label') {
    return !!candidate.labelProps;
  }
  if (candidate.type === 'stat') {
    return !!candidate.stat && isStatDefinition(candidate.stat);
  }
  return false;
}

function isStatDefinition(value: unknown): value is SequencerStatDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SequencerStatDefinition;
  if (candidate.mode === 'simple') {
    return isStatQuery(candidate.query);
  }

  if (candidate.mode === 'complex') {
    return isStatNode(candidate.expression)
      && (!candidate.editor || isStatEditor(candidate.editor));
  }

  return false;
}

function isStatQuery(value: unknown): value is SequencerStatQuery {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as SequencerStatQuery;
  const validColors = !candidate.labelColorById || Object.values(candidate.labelColorById).every(color => typeof color === 'string');
  return Array.isArray(candidate.eventIds)
    && Array.isArray(candidate.labelIds)
    && candidate.metric === 'count'
    && candidate.labelMatch === 'all'
    && validColors;
}


function isStatEditor(value: unknown): value is { terms: SequencerStatEditorTerm[]; tokens: SequencerStatExpressionToken[] } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { terms?: SequencerStatEditorTerm[]; tokens?: SequencerStatExpressionToken[] };
  if (!Array.isArray(candidate.terms) || !Array.isArray(candidate.tokens)) {
    return false;
  }

  const termsOk = candidate.terms.every(term =>
    typeof term.id === 'string'
    && typeof term.displayName === 'string'
    && (term.kind === 'query' || term.kind === 'constant')
    && (term.kind === 'query' ? !!term.query && isStatQuery(term.query) : typeof term.constantValue === 'number'),
  );

  const tokenOk = candidate.tokens.every(token =>
    (token.kind === 'term' && typeof token.termId === 'string')
    || (token.kind === 'operator' && ['+', '-', '*', '/'].includes(token.op))
    || (token.kind === 'paren' && (token.value === '(' || token.value === ')')),
  );

  return termsOk && tokenOk;
}
function isStatNode(value: unknown): value is SequencerStatNode {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SequencerStatNode;
  if (candidate.kind === 'constant') {
    return typeof candidate.value === 'number' && Number.isFinite(candidate.value);
  }
  if (candidate.kind === 'query') {
    return isStatQuery(candidate.query);
  }
  if (candidate.kind === 'group') {
    return ['+', '-', '*', '/'].includes(candidate.op) && isStatNode(candidate.left) && isStatNode(candidate.right);
  }
  return false;
}
