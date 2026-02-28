import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { TimebaseService } from './timebase.service';
import { VideoService } from './video.service';
import {
  TIMELINE_BUFFER_WORK_DURATION_MS,
  TIMELINE_DEFAULT_POST_MS,
  TIMELINE_DEFAULT_PRE_MS,
} from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineEventDef, TimelineOccurrence, TimelineShiftScope } from '../../interfaces/timeline/timeline.interface';
import {
  addLabelToSelection,
  addOccurrence,
  alignToCurrentTimebase,
  removeLabelFromSelection,
  setAutoFollow,
  setSelection,
  setUiScroll,
  shiftTimeline,
  undoLastShiftOrAlign,
  updateOccurrenceTiming,
} from '../../store/Timeline/timeline.actions';
import {
  selectTimelineAutoFollow,
  selectTimelineEventDefs,
  selectTimelineOccurrences,
  selectTimelineScroll,
  selectTimelineSelectionIds,
} from '../../store/Timeline/timeline.selectors';
import { mergeIntervalsForPlayback, normalizeTiming } from '../../utils/timeline/timeline-time.utils';

@Injectable({ providedIn: 'root' })
export class TimelineFacadeService {
  private readonly store = inject(Store);
  private readonly timebase = inject(TimebaseService);
  private readonly videoService = inject(VideoService);

  readonly eventDefs = this.store.selectSignal(selectTimelineEventDefs);
  readonly occurrences = this.store.selectSignal(selectTimelineOccurrences);
  readonly selectionIds = this.store.selectSignal(selectTimelineSelectionIds);
  readonly uiScroll = this.store.selectSignal(selectTimelineScroll);
  readonly autoFollow = this.store.selectSignal(selectTimelineAutoFollow);

  readonly hasChronoOrVideo: Signal<boolean> = computed(
    () => this.timebase.mode() === 'video' || this.timebase.currentTimeMs() > 0,
  );
  readonly lastOccurrenceEndMs = computed(() => Math.max(0, ...this.occurrences().map(o => o.endMs)));
  readonly workDurationMs = computed(() =>
    Math.max(
      this.timebase.currentTimeMs() + TIMELINE_BUFFER_WORK_DURATION_MS,
      this.lastOccurrenceEndMs() + TIMELINE_BUFFER_WORK_DURATION_MS,
    ),
  );

  private readonly openOccurrenceByEventDef = signal<Record<string, string>>({});
  private playSelectionTimer?: number;

  setSelection(ids: string[]) {
    this.store.dispatch(setSelection({ ids }));
  }

  toggleSelection(id: string, additive: boolean) {
    const current = new Set(this.selectionIds());
    if (!additive) {
      this.setSelection([id]);
      return;
    }
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.setSelection(Array.from(current));
  }

  markIn(eventDefId: string) {
    const eventDef = this.eventDefs().find(definition => definition.id === eventDefId);
    if (!eventDef) {
      return;
    }
    const now = this.timebase.currentTimeMs();
    const occurrence = this.createOccurrence(eventDef, now);
    this.store.dispatch(addOccurrence({ occurrence }));

    if (eventDef.timingMode === 'indefinite') {
      this.openOccurrenceByEventDef.set({ ...this.openOccurrenceByEventDef(), [eventDefId]: occurrence.id });
    }
  }

  markOut(eventDefId: string) {
    const occurrenceId = this.openOccurrenceByEventDef()[eventDefId];
    if (!occurrenceId) {
      return;
    }
    const occurrence = this.occurrences().find(item => item.id === occurrenceId);
    const eventDef = this.eventDefs().find(definition => definition.id === eventDefId);
    if (!occurrence || !eventDef) {
      return;
    }
    const normalized = normalizeTiming(occurrence.startMs, this.timebase.currentTimeMs() + eventDef.postMs);
    this.store.dispatch(updateOccurrenceTiming({ id: occurrence.id, ...normalized, isOpen: false }));

    const nextMap = { ...this.openOccurrenceByEventDef() };
    delete nextMap[eventDefId];
    this.openOccurrenceByEventDef.set(nextMap);
  }

  updateOccurrenceTiming(id: string, startMs: number, endMs: number, isOpen?: boolean) {
    const normalized = normalizeTiming(startMs, endMs);
    this.store.dispatch(updateOccurrenceTiming({ id, ...normalized, isOpen }));
  }

  shift(deltaMs: number, scope: TimelineShiftScope) {
    this.store.dispatch(shiftTimeline({ deltaMs, scope }));
  }

  align(referenceOccurrenceId: string) {
    this.store.dispatch(
      alignToCurrentTimebase({ referenceOccurrenceId, currentTimeMs: this.timebase.currentTimeMs() }),
    );
  }

  undoShiftOrAlign() {
    this.store.dispatch(undoLastShiftOrAlign());
  }

  addLabelToSelection(labelId: string) {
    this.store.dispatch(addLabelToSelection({ labelId }));
  }

  removeLabelFromSelection(labelId: string) {
    this.store.dispatch(removeLabelFromSelection({ labelId }));
  }

  setScroll(scrollX: number, scrollY: number) {
    this.store.dispatch(setUiScroll({ scrollX, scrollY }));
  }

  setAutoFollow(enabled: boolean) {
    this.store.dispatch(setAutoFollow({ enabled }));
  }

  playSelection() {
    this.stopSelectionPlayback();
    const selectedIds = new Set(this.selectionIds());
    const intervals = mergeIntervalsForPlayback(
      this.occurrences()
        .filter(occurrence => selectedIds.has(occurrence.id))
        .map(occurrence => ({
          startMs: occurrence.startMs,
          endMs: this.clampPlaybackEnd(occurrence.endMs),
        })),
    );

    if (!intervals.length) {
      return;
    }

    let intervalIndex = 0;
    const playInterval = () => {
      const interval = intervals[intervalIndex];
      if (!interval) {
        this.timebase.pause();
        return;
      }
      this.timebase.seekTo(interval.startMs);
      this.timebase.play();
      this.playSelectionTimer = window.setInterval(() => {
        if (this.timebase.currentTimeMs() >= interval.endMs) {
          this.timebase.pause();
          window.clearInterval(this.playSelectionTimer);
          intervalIndex += 1;
          playInterval();
        }
      }, 40);
    };

    playInterval();
  }

  stopSelectionPlayback() {
    if (this.playSelectionTimer !== undefined) {
      window.clearInterval(this.playSelectionTimer);
      this.playSelectionTimer = undefined;
    }
  }

  private createOccurrence(eventDef: TimelineEventDef, nowMs: number): TimelineOccurrence {
    const start = nowMs - (eventDef.preMs ?? TIMELINE_DEFAULT_PRE_MS);
    const rawEnd = eventDef.timingMode === 'once' ? nowMs + (eventDef.postMs ?? TIMELINE_DEFAULT_POST_MS) : start;
    const normalized = normalizeTiming(start, rawEnd);
    const createdAtIso = new Date().toISOString();
    return {
      id: `occ_${Math.random().toString(36).slice(2, 10)}`,
      eventDefId: eventDef.id,
      startMs: normalized.startMs,
      endMs: normalized.endMs,
      labelIds: [],
      createdAtIso,
      updatedAtIso: createdAtIso,
      isOpen: eventDef.timingMode === 'indefinite',
    };
  }

  private clampPlaybackEnd(endMs: number): number {
    const durationMs = this.videoService.durationMs();
    if (!durationMs) {
      return endMs;
    }
    return Math.min(endMs, durationMs);
  }
}
