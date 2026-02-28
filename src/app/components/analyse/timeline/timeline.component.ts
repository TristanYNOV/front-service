import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import {
  TIMELINE_AUTO_FOLLOW_COMFORT_ZONE,
  TIMELINE_AUTO_FOLLOW_TARGET_RATIO,
  TIMELINE_PIXELS_PER_SECOND,
  TIMELINE_ROW_HEIGHT_PX,
} from '../../../interfaces/timeline/timeline-defaults.constants';
import { TimelineFacadeService } from '../../../core/services/timeline-facade.service';
import { TimebaseService } from '../../../core/services/timebase.service';
import { TimelineOccurrence } from '../../../interfaces/timeline/timeline.interface';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnDestroy {
  @ViewChild('eventListViewport', { static: false }) eventListViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('timeViewport', { static: false }) timeViewportRef?: ElementRef<HTMLDivElement>;

  readonly facade = inject(TimelineFacadeService);
  readonly timebase = inject(TimebaseService);

  readonly focused = signal(false);

  private readonly isProgrammaticScrollSignal = signal(false);
  readonly isProgrammaticScroll = this.isProgrammaticScrollSignal.asReadonly();
  private programmaticScrollReleaseTimeout?: number;

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
    effect(() => {
      if (!this.facade.autoFollow() || !this.timebase.isPlaying()) {
        return;
      }
      const viewport = this.timeViewportRef?.nativeElement;
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
      this.setProgrammaticScroll(() => {
        viewport.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }, 900);
      this.facade.setScroll(targetLeft, viewport.scrollTop);
    });
  }


  ngOnDestroy() {
    if (this.programmaticScrollReleaseTimeout !== undefined) {
      window.clearTimeout(this.programmaticScrollReleaseTimeout);
      this.programmaticScrollReleaseTimeout = undefined;
    }
  }

  onTimeViewportScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    const eventListViewport = this.eventListViewportRef?.nativeElement;
    if (eventListViewport && eventListViewport.scrollTop !== target.scrollTop) {
      eventListViewport.scrollTop = target.scrollTop;
    }

    this.facade.setScroll(target.scrollLeft, target.scrollTop);

    if (!this.isProgrammaticScroll() && this.timebase.isPlaying()) {
      this.facade.setAutoFollow(false);
    }
  }

  onEventListViewportScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    const timeViewport = this.timeViewportRef?.nativeElement;
    if (timeViewport && timeViewport.scrollTop !== target.scrollTop) {
      timeViewport.scrollTop = target.scrollTop;
    }
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
      const deltaMs = (moveEvent.clientX - startX) / this.pxPerMs;
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
    return this.visibleOccurrencesByEvent().get(eventDefId) ?? [];
  }

  occurrenceWidthPx(occurrence: TimelineOccurrence) {
    const eventDef = this.facade.eventDefs().find(definition => definition.id === occurrence.eventDefId);
    const endMs = occurrence.isOpen ? this.timebase.currentTimeMs() + (eventDef?.postMs ?? 1000) : occurrence.endMs;
    return Math.max(8, (endMs - occurrence.startMs) * this.pxPerMs);
  }

  occurrenceLeftPx(occurrence: TimelineOccurrence) {
    return occurrence.startMs * this.pxPerMs;
  }

  playheadPx() {
    return this.timebase.currentTimeMs() * this.pxPerMs;
  }

  recenter() {
    const viewport = this.timeViewportRef?.nativeElement;
    if (!viewport) {
      return;
    }
    const nextLeft = Math.max(0, this.playheadPx() - viewport.clientWidth * 0.5);
    this.setProgrammaticScroll(() => {
      viewport.scrollTo({ left: nextLeft, behavior: 'smooth' });
    }, 900);
    this.facade.setScroll(nextLeft, viewport.scrollTop);
    this.facade.setAutoFollow(true);
  }

  private setProgrammaticScroll(callback: () => void, holdMs = 500) {
    this.isProgrammaticScrollSignal.set(true);
    callback();

    if (this.programmaticScrollReleaseTimeout !== undefined) {
      window.clearTimeout(this.programmaticScrollReleaseTimeout);
    }

    this.programmaticScrollReleaseTimeout = window.setTimeout(() => {
      this.isProgrammaticScrollSignal.set(false);
      this.programmaticScrollReleaseTimeout = undefined;
    }, holdMs);
  }
}
