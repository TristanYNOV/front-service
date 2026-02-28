import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  TIMELINE_AUTO_FOLLOW_COMFORT_ZONE,
  TIMELINE_AUTO_FOLLOW_TARGET_RATIO,
  TIMELINE_PIXELS_PER_SECOND,
  TIMELINE_ROW_HEIGHT_PX,
  TIMELINE_SCHEMA_VERSION,
} from '../../../interfaces/timeline/timeline-defaults.constants';
import { TimelineFacadeService } from '../../../core/services/timeline-facade.service';
import { TimebaseService } from '../../../core/services/timebase.service';
import { initTimeline } from '../../../store/Timeline/timeline.actions';
import { selectTimelineEventDefs, selectTimelineLabelDefs } from '../../../store/Timeline/timeline.selectors';
import { TimelineOccurrence } from '../../../interfaces/timeline/timeline.interface';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  @ViewChild('viewport', { static: false }) viewportRef?: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);
  readonly facade = inject(TimelineFacadeService);
  readonly timebase = inject(TimebaseService);

  readonly eventDefs = this.store.selectSignal(selectTimelineEventDefs);
  readonly labelDefs = this.store.selectSignal(selectTimelineLabelDefs);

  readonly currentEventDefId = signal('');
  readonly focused = signal(false);
  readonly resizedOccurrenceId = signal<string | null>(null);

  readonly pxPerMs = TIMELINE_PIXELS_PER_SECOND / 1000;
  readonly rowHeightPx = TIMELINE_ROW_HEIGHT_PX;

  readonly contentWidthPx = computed(() => Math.max(1200, Math.ceil(this.facade.workDurationMs() * this.pxPerMs)));
  readonly rulerTicks = computed(() => Array.from({ length: Math.ceil(this.contentWidthPx() / 80) }, (_, index) => index));
  readonly selectedOccurrences = computed(() => {
    const selectedIds = new Set(this.facade.selectionIds());
    return this.facade.occurrences().filter(occurrence => selectedIds.has(occurrence.id));
  });

  readonly visibleOccurrencesByEvent = computed(() => {
    const scroll = this.facade.uiScroll();
    const visibleStart = Math.max(0, scroll.scrollX / this.pxPerMs - 2000);
    const visibleEnd = visibleStart + 20000;
    const byEvent = new Map<string, TimelineOccurrence[]>();
    this.facade.occurrences().forEach(occurrence => {
      if (occurrence.endMs < visibleStart || occurrence.startMs > visibleEnd) {
        return;
      }
      const list = byEvent.get(occurrence.eventDefId) ?? [];
      list.push(occurrence);
      byEvent.set(occurrence.eventDefId, list);
    });
    return byEvent;
  });

  constructor() {
    this.bootstrapTimeline();


    effect(() => {
      if (this.currentEventDefId()) {
        return;
      }
      const first = this.eventDefs()[0];
      if (first) {
        this.currentEventDefId.set(first.id);
      }
    });

    effect(() => {
      if (!this.facade.autoFollow() || !this.timebase.isPlaying()) {
        return;
      }
      const viewport = this.viewportRef?.nativeElement;
      if (!viewport) {
        return;
      }
      const playheadX = this.timebase.currentTimeMs() * this.pxPerMs;
      const leftComfort = viewport.scrollLeft + viewport.clientWidth * TIMELINE_AUTO_FOLLOW_COMFORT_ZONE[0];
      const rightComfort = viewport.scrollLeft + viewport.clientWidth * TIMELINE_AUTO_FOLLOW_COMFORT_ZONE[1];
      if (playheadX >= leftComfort && playheadX <= rightComfort) {
        return;
      }
      const targetLeft = Math.max(0, playheadX - viewport.clientWidth * TIMELINE_AUTO_FOLLOW_TARGET_RATIO);
      viewport.scrollTo({ left: targetLeft, behavior: 'smooth' });
      this.facade.setScroll(targetLeft, viewport.scrollTop);
    });
  }

  onViewportScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    this.facade.setScroll(target.scrollLeft, target.scrollTop);
    if (this.timebase.isPlaying()) {
      this.facade.setAutoFollow(false);
    }
  }

  onOccurrenceClick(occurrenceId: string, event: MouseEvent) {
    this.facade.toggleSelection(occurrenceId, event.ctrlKey || event.metaKey);
  }


  onOccurrenceKeydown(occurrenceId: string, event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    this.facade.toggleSelection(occurrenceId, keyboardEvent.ctrlKey || keyboardEvent.metaKey);
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.focused()) {
      return;
    }
    const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (event.target as HTMLElement | null)?.isContentEditable) {
      return;
    }
    if (event.key.toLowerCase() === 'i') {
      this.tryMarkIn();
      event.preventDefault();
      event.stopPropagation();
    }
    if (event.key.toLowerCase() === 'o') {
      this.tryMarkOut();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  tryMarkIn() {
    const eventDefId = this.currentEventDefId();
    if (eventDefId) {
      this.facade.markIn(eventDefId);
    }
  }

  tryMarkOut() {
    const eventDefId = this.currentEventDefId();
    if (eventDefId) {
      this.facade.markOut(eventDefId);
    }
  }

  startResize(occurrence: TimelineOccurrence, edge: 'start' | 'end', event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.resizedOccurrenceId.set(occurrence.id);
    const startX = event.clientX;
    const initialStart = occurrence.startMs;
    const initialEnd = occurrence.endMs;

    const move = (moveEvent: MouseEvent) => {
      const deltaMs = (moveEvent.clientX - startX) / this.pxPerMs;
      if (edge === 'start') {
        this.facade.updateOccurrenceTiming(occurrence.id, initialStart + deltaMs, initialEnd);
      } else {
        this.facade.updateOccurrenceTiming(occurrence.id, initialStart, initialEnd + deltaMs);
      }
    };
    const up = () => {
      this.resizedOccurrenceId.set(null);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  nudgeSelection(deltaMs: number) {
    this.selectedOccurrences().forEach(occurrence => {
      this.facade.updateOccurrenceTiming(occurrence.id, occurrence.startMs + deltaMs, occurrence.endMs + deltaMs, occurrence.isOpen);
    });
  }

  rowOccurrences(eventDefId: string) {
    return this.visibleOccurrencesByEvent().get(eventDefId) ?? [];
  }

  occurrenceWidthPx(occurrence: TimelineOccurrence) {
    const endMs = occurrence.isOpen ? this.timebase.currentTimeMs() + 1000 : occurrence.endMs;
    return Math.max(8, (endMs - occurrence.startMs) * this.pxPerMs);
  }

  occurrenceLeftPx(occurrence: TimelineOccurrence) {
    return occurrence.startMs * this.pxPerMs;
  }

  playheadPx() {
    return this.timebase.currentTimeMs() * this.pxPerMs;
  }

  recenter() {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) {
      return;
    }
    const nextLeft = Math.max(0, this.playheadPx() - viewport.clientWidth * 0.5);
    viewport.scrollTo({ left: nextLeft, behavior: 'smooth' });
    this.facade.setAutoFollow(true);
  }

  private bootstrapTimeline() {
    if (this.eventDefs().length) {
      return;
    }
    this.store.dispatch(
      initTimeline({
        schemaVersion: TIMELINE_SCHEMA_VERSION,
        meta: {
          analysisName: 'Match amical - Faux live',
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
          userId: 'user_123',
          team: 'Athenes FC',
          players: ['P1', 'P2', 'P3'],
        },
        definitions: {
          eventDefs: [
            { id: 'evt_kickoff', name: 'Coup d’envoi', timingMode: 'once', preMs: 1500, postMs: 1500 },
            { id: 'evt_attack', name: 'Phase offensive', timingMode: 'indefinite', preMs: 1000, postMs: 2000 },
            { id: 'evt_shot', name: 'Tir', timingMode: 'once', preMs: 800, postMs: 1200 },
          ],
          labelDefs: [
            { id: 'lbl_important', name: 'Important', behavior: 'once' },
            { id: 'lbl_error', name: 'Erreur', behavior: 'once' },
            { id: 'lbl_review', name: 'À revoir', behavior: 'indefinite' },
          ],
        },
        occurrences: [],
      }),
    );
  }
}
