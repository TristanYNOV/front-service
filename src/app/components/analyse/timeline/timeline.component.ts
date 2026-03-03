import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  TIMELINE_AUTO_FOLLOW_COMFORT_ZONE,
  TIMELINE_AUTO_FOLLOW_TARGET_RATIO,
  TIMELINE_PIXELS_PER_SECOND,
  TIMELINE_ROW_HEIGHT_PX,
} from '../../../interfaces/timeline/timeline-defaults.constants';
import { TimelineFacadeService } from '../../../core/services/timeline-facade.service';
import { TimebaseService } from '../../../core/services/timebase.service';
import { TimelineOccurrence } from '../../../interfaces/timeline/timeline.interface';
import { TimelineLabelsDialogComponent } from './timeline-labels-dialog.component';
import { getReadableTextColor } from '../../../utils/color/color-contrast.utils';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TimelineZoomService } from '../../../core/services/timeline-zoom.service';
import { ZoomControlsComponent } from '../../shared/zoom-controls/zoom-controls.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, MatIconModule, ZoomControlsComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnDestroy, AfterViewInit {
  @ViewChild('timeScrollEl', { static: false }) timeScrollElRef?: ElementRef<HTMLDivElement>;
  @ViewChild('timelineRoot', { static: false }) timelineRootRef?: ElementRef<HTMLDivElement>;

  readonly facade = inject(TimelineFacadeService);
  readonly timebase = inject(TimebaseService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  readonly timelineZoom = inject(TimelineZoomService);

  readonly rowHeightPx = TIMELINE_ROW_HEIGHT_PX;
  readonly rulerHeightPx = 36;
  readonly leftColumnWidthPx = 220;
  readonly basePxPerMs = TIMELINE_PIXELS_PER_SECOND / 1000;

  readonly scrollTopPx = signal(0);
  readonly timelineHasFocus = signal(false);
  readonly isEditingTimelineName = signal(false);
  readonly timelineNameDraft = signal('');
  readonly containerWidthPx = signal(0);

  private readonly isProgrammaticScrollSignal = signal(false);
  private programmaticScrollTimeoutId?: number;
  private timelineResizeObserver?: ResizeObserver;
  private readonly defaultEventColor = '#1F3D28';

  readonly timelineEndMsForFit = computed(() => {
    if (this.timebase.mode() !== 'clock') {
      return this.facade.workDurationMs();
    }

    const occurrences = this.facade.occurrences();
    if (occurrences.length === 0) {
      return this.facade.workDurationMs();
    }

    const eventDefsById = new Map(this.facade.eventDefs().map(eventDef => [eventDef.id, eventDef]));
    const hasOpenOccurrence = occurrences.some(occurrence => occurrence.isOpen);
    const currentTimeMs = hasOpenOccurrence ? this.timebase.currentTimeMs() : 0;

    const maxEndMs = occurrences.reduce((maxValue, occurrence) => {
      if (occurrence.isOpen) {
        const eventDef = eventDefsById.get(occurrence.eventDefId);
        const endCandidate = currentTimeMs + (eventDef?.postMs ?? 1000);
        return Math.max(maxValue, endCandidate);
      }
      return Math.max(maxValue, occurrence.endMs);
    }, 0);

    return maxEndMs > 0 ? maxEndMs : this.facade.workDurationMs();
  });

  readonly fitZoom = computed(() => {
    const width = this.containerWidthPx();
    const durationMs = this.timelineEndMsForFit();

    if (width <= 0 || durationMs <= 0) {
      return 1;
    }

    const rawFit = width / (durationMs * this.basePxPerMs);
    return this.clamp(rawFit, 0.01, 1);
  });

  readonly actualZoom = computed(() => {
    const ui = this.timelineZoom.uiZoom();
    const fit = this.fitZoom();
    const t = this.clamp((ui - this.timelineZoom.minUi) / (this.timelineZoom.maxUi - this.timelineZoom.minUi), 0, 1);
    return fit + t * (1 - fit);
  });

  readonly pxPerMs = computed(() => this.basePxPerMs * this.actualZoom());

  readonly contentWidthPx = computed(() => {
    const minWidth = Math.max(1, this.containerWidthPx());
    const naturalWidth = Math.ceil(this.timelineEndMsForFit() * this.pxPerMs());
    return Math.max(minWidth, naturalWidth);
  });

  readonly contentHeightPx = computed(() => this.rulerHeightPx + this.facade.eventDefs().length * this.rowHeightPx);
  readonly rulerTicks = computed(() => Array.from({ length: Math.ceil(this.contentWidthPx() / 80) }, (_, index) => index));
  readonly tickMs = computed(() => 80 / this.pxPerMs());

  readonly selectedOccurrences = computed(() => {
    const selectedIds = new Set(this.facade.selectionIds());
    return this.facade.occurrences().filter(occurrence => selectedIds.has(occurrence.id));
  });

  readonly selectedCount = computed(() => this.facade.selectionIds().length);
  readonly selectionContainsOpen = computed(() => this.selectedOccurrences().some(occurrence => occurrence.isOpen));
  readonly canDeleteSelection = computed(() => this.selectedCount() > 0 && !this.selectionContainsOpen());

  private readonly labelNameById = computed(() =>
    this.facade.labelDefs().reduce<Record<string, string>>((accumulator, definition) => {
      accumulator[definition.id] = definition.name;
      return accumulator;
    }, {}),
  );

  constructor() {
    effect(() => {
      if (!this.isEditingTimelineName()) {
        this.timelineNameDraft.set(this.facade.timelineName());
      }
    });

    effect(() => {
      if (!this.facade.autoFollow() || !this.timebase.isPlaying()) {
        return;
      }

      const timeScrollEl = this.timeScrollElRef?.nativeElement;
      if (!timeScrollEl) {
        return;
      }

      const playheadX = this.timebase.currentTimeMs() * this.pxPerMs();
      const leftComfort = timeScrollEl.scrollLeft + timeScrollEl.clientWidth * TIMELINE_AUTO_FOLLOW_COMFORT_ZONE[0];
      const rightComfort = timeScrollEl.scrollLeft + timeScrollEl.clientWidth * TIMELINE_AUTO_FOLLOW_COMFORT_ZONE[1];
      if (playheadX >= leftComfort && playheadX <= rightComfort) {
        return;
      }

      const targetLeft = Math.max(0, playheadX - timeScrollEl.clientWidth * TIMELINE_AUTO_FOLLOW_TARGET_RATIO);
      this.setProgrammaticScroll(() => {
        timeScrollEl.scrollTo({ left: targetLeft, top: timeScrollEl.scrollTop, behavior: 'auto' });
      });
      this.facade.setScroll(targetLeft, timeScrollEl.scrollTop);
    });
  }

  ngAfterViewInit() {
    const timeScrollEl = this.timeScrollElRef?.nativeElement;
    if (!timeScrollEl) {
      return;
    }

    this.containerWidthPx.set(timeScrollEl.clientWidth);

    if (typeof window === 'undefined' || !('ResizeObserver' in window)) {
      return;
    }

    this.timelineResizeObserver = new ResizeObserver(() => {
      this.containerWidthPx.set(timeScrollEl.clientWidth);
    });
    this.timelineResizeObserver.observe(timeScrollEl);
  }

  ngOnDestroy() {
    if (this.programmaticScrollTimeoutId !== undefined) {
      window.clearTimeout(this.programmaticScrollTimeoutId);
      this.programmaticScrollTimeoutId = undefined;
    }

    this.timelineResizeObserver?.disconnect();
    this.timelineResizeObserver = undefined;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    const timelineRoot = this.timelineRootRef?.nativeElement;
    if (!timelineRoot) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node) || !timelineRoot.contains(target)) {
      this.timelineHasFocus.set(false);
    }
  }

  onTimelineFocusIn() {
    this.timelineHasFocus.set(true);
  }

  onTimelineFocusOut() {
    const timelineRoot = this.timelineRootRef?.nativeElement;
    if (!timelineRoot || typeof document === 'undefined') {
      this.timelineHasFocus.set(false);
      return;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !timelineRoot.contains(activeElement)) {
      this.timelineHasFocus.set(false);
    }
  }

  onTimelinePointerDown(event: MouseEvent) {
    const timelineRoot = this.timelineRootRef?.nativeElement;
    if (!timelineRoot || this.isTextInputTarget(event.target)) {
      return;
    }

    timelineRoot.focus();
    this.timelineHasFocus.set(true);
  }

  async onTimelineKeydown(event: KeyboardEvent) {
    const isDeleteKey =
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.code === 'Backspace' ||
      event.code === 'Delete';

    if (!isDeleteKey || !this.timelineHasFocus() || this.isTextInputTarget(event.target) || !this.canDeleteSelection()) {
      return;
    }

    event.preventDefault();
    await this.deleteSelection();
  }

  onMainScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    this.scrollTopPx.set(target.scrollTop);
    this.facade.setScroll(target.scrollLeft, target.scrollTop);

    if (!this.isProgrammaticScrollSignal() && this.timebase.isPlaying() && this.facade.autoFollow()) {
      this.facade.setAutoFollow(false);
    }
  }

  async deleteSelection() {
    if (!this.canDeleteSelection()) {
      return;
    }

    const selectedIds = this.selectedOccurrences().map(occurrence => occurrence.id);
    const count = selectedIds.length;
    const confirmed = await this.confirmDialogService.confirm({
      title: 'Confirmer la suppression',
      message:
        count === 1
          ? 'Voulez-vous supprimer cette occurrence ?'
          : `Voulez-vous supprimer ces ${count} occurrences ?`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });

    if (!confirmed) {
      return;
    }

    this.facade.removeSelectedOccurrences(selectedIds);
  }

  deleteSelectionTooltip() {
    if (this.selectionContainsOpen()) {
      return 'Impossible de supprimer une occurrence en cours. Terminez l’événement d’abord.';
    }

    return `Supprimer la sélection (${this.selectedCount()})`;
  }

  startTimelineNameEdit() {
    this.timelineNameDraft.set(this.facade.timelineName());
    this.isEditingTimelineName.set(true);
  }

  onTimelineNameInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    this.timelineNameDraft.set(target.value);
  }

  saveTimelineName() {
    this.facade.setTimelineName(this.timelineNameDraft());
    this.isEditingTimelineName.set(false);
  }

  cancelTimelineNameEdit() {
    this.timelineNameDraft.set(this.facade.timelineName());
    this.isEditingTimelineName.set(false);
  }

  onRulerPointerDown(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();

    const seekFromPointer = (pointerEvent: MouseEvent) => {
      const timeScrollEl = this.timeScrollElRef?.nativeElement;
      if (!timeScrollEl) {
        return;
      }
      const rulerRect = timeScrollEl.getBoundingClientRect();
      const xWithinViewport = Math.max(0, pointerEvent.clientX - rulerRect.left);
      const absoluteX = xWithinViewport + timeScrollEl.scrollLeft;
      const targetMs = Math.max(0, absoluteX / this.pxPerMs());
      this.timebase.seekTo(targetMs);
    };

    seekFromPointer(event);

    const move = (moveEvent: MouseEvent) => {
      seekFromPointer(moveEvent);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  onOccurrenceClick(occurrenceId: string, event: MouseEvent) {
    this.facade.toggleSelection(occurrenceId, event.ctrlKey || event.metaKey);
  }

  onOccurrenceKeydown(occurrenceId: string, event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    this.facade.toggleSelection(occurrenceId, keyboardEvent.ctrlKey || keyboardEvent.metaKey);
  }

  startResize(occurrence: TimelineOccurrence, edge: 'start' | 'end', event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const initialStart = occurrence.startMs;
    const initialEnd = occurrence.endMs;

    const move = (moveEvent: MouseEvent) => {
      const deltaMs = (moveEvent.clientX - startX) / this.pxPerMs();
      if (edge === 'start') {
        this.facade.updateOccurrenceTiming(occurrence.id, initialStart + deltaMs, initialEnd);
      } else {
        this.facade.updateOccurrenceTiming(occurrence.id, initialStart, initialEnd + deltaMs);
      }
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  openLabelsDialog() {
    if (this.selectedCount() !== 1) {
      return;
    }

    const selectedOccurrence = this.selectedOccurrences()[0];
    if (!selectedOccurrence) {
      return;
    }

    this.dialog.open(TimelineLabelsDialogComponent, {
      data: {
        occurrenceId: selectedOccurrence.id,
        selectedLabelIds: [...selectedOccurrence.labelIds],
        labelDefs: this.facade.labelDefs().map(definition => ({ id: definition.id, name: definition.name })),
        toggleLabel: (occurrenceId: string, labelId: string) => this.facade.toggleOccurrenceLabel(occurrenceId, labelId),
      },
    });
  }

  labelsEditTooltip() {
    return this.selectedCount() === 1 ? 'Modifier les labels' : 'Disponible uniquement pour une sélection unique';
  }

  nudgeSelection(deltaMs: number) {
    this.selectedOccurrences().forEach(occurrence => {
      this.facade.updateOccurrenceTiming(
        occurrence.id,
        occurrence.startMs + deltaMs,
        occurrence.endMs + deltaMs,
        occurrence.isOpen,
      );
    });
  }

  rowOccurrences(eventDefId: string) {
    return this.facade.occurrences().filter(occurrence => occurrence.eventDefId === eventDefId);
  }

  occurrenceWidthPx(occurrence: TimelineOccurrence) {
    const eventDef = this.facade.eventDefs().find(definition => definition.id === occurrence.eventDefId);
    const endMs = occurrence.isOpen ? this.timebase.currentTimeMs() + (eventDef?.postMs ?? 1000) : occurrence.endMs;
    return Math.max(8, (endMs - occurrence.startMs) * this.pxPerMs());
  }

  occurrenceLeftPx(occurrence: TimelineOccurrence) {
    return occurrence.startMs * this.pxPerMs();
  }

  occurrenceLabelSummary(occurrence: TimelineOccurrence) {
    const labelNames = this.occurrenceLabelNames(occurrence);
    return {
      visible: labelNames.slice(0, 2),
      hiddenCount: Math.max(0, labelNames.length - 2),
      tooltip: labelNames.join(', '),
    };
  }

  formatTime(valueMs: number) {
    const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  private occurrenceLabelNames(occurrence: TimelineOccurrence) {
    const labelNameById = this.labelNameById();
    return occurrence.labelIds.map(id => labelNameById[id]).filter((name): name is string => Boolean(name));
  }

  occurrenceStyle(occurrence: TimelineOccurrence) {
    const eventDef = this.facade.eventDefs().find(definition => definition.id === occurrence.eventDefId);
    const background = eventDef?.colorHex ?? this.defaultEventColor;
    const isSelected = this.facade.selectionIds().includes(occurrence.id);

    return {
      backgroundColor: isSelected ? this.withOpacity(background, 0.8) : background,
      color: getReadableTextColor(background),
    };
  }

  playheadLeftPx() {
    return this.timebase.currentTimeMs() * this.pxPerMs();
  }

  recenter() {
    const timeScrollEl = this.timeScrollElRef?.nativeElement;
    if (!timeScrollEl) {
      return;
    }
    const targetLeft = Math.max(0, this.playheadLeftPx() - timeScrollEl.clientWidth * 0.5);
    this.setProgrammaticScroll(() => {
      timeScrollEl.scrollTo({ left: targetLeft, top: timeScrollEl.scrollTop, behavior: 'auto' });
    });
    this.facade.setScroll(targetLeft, timeScrollEl.scrollTop);
    this.facade.setAutoFollow(true);
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

  private withOpacity(hex: string, opacity: number) {
    const value = hex.trim();
    const normalized = /^#?[0-9a-fA-F]{6}$/.test(value) ? (value.startsWith('#') ? value : `#${value}`) : this.defaultEventColor;
    const r = Number.parseInt(normalized.slice(1, 3), 16);
    const g = Number.parseInt(normalized.slice(3, 5), 16);
    const b = Number.parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private setProgrammaticScroll(callback: () => void) {
    this.isProgrammaticScrollSignal.set(true);
    callback();

    if (this.programmaticScrollTimeoutId !== undefined) {
      window.clearTimeout(this.programmaticScrollTimeoutId);
    }

    this.programmaticScrollTimeoutId = window.setTimeout(() => {
      this.isProgrammaticScrollSignal.set(false);
      this.programmaticScrollTimeoutId = undefined;
    }, 120);
  }
}
