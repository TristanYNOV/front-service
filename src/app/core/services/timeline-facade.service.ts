import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { TimebaseService } from './timebase.service';
import { VideoService } from './video.service';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { SequencerRuntimeEvent, SequencerRuntimeService } from '../service/sequencer-runtime.service';
import {
  TIMELINE_BUFFER_WORK_DURATION_MS,
  TIMELINE_DEFAULT_POST_MS,
  TIMELINE_DEFAULT_PRE_MS,
} from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineDefinitions, TimelineEventDef, TimelineOccurrence, TimelineShiftScope } from '../../interfaces/timeline/timeline.interface';
import {
  addOccurrence,
  alignToCurrentTimebase,
  setAutoFollow,
  setSelection,
  setUiScroll,
  shiftTimeline,
  undoLastShiftOrAlign,
  updateOccurrenceTiming,
  upsertDefinitions,
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
  private readonly sequencerPanelService = inject(SequencerPanelService);
  private readonly sequencerRuntimeService = inject(SequencerRuntimeService);

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
  private readonly handledRuntimeEventKeys = new Set<string>();
  private playSelectionTimer?: number;

  constructor() {
    effect(() => {
      const definitions = this.buildDefinitionsFromSequencer();
      this.store.dispatch(upsertDefinitions({ definitions }));
    });

    effect(() => {
      const latestEvent = this.sequencerRuntimeService.recentRuntimeEvents()[0];
      if (!latestEvent) {
        return;
      }
      const eventKey = `${latestEvent.type}:${latestEvent.btnId}:${latestEvent.timestamp}`;
      if (this.handledRuntimeEventKeys.has(eventKey)) {
        return;
      }
      this.handledRuntimeEventKeys.add(eventKey);
      this.consumeRuntimeEvent(latestEvent);
    });
  }

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
          if (this.playSelectionTimer !== undefined) {
            window.clearInterval(this.playSelectionTimer);
          }
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

  private consumeRuntimeEvent(event: SequencerRuntimeEvent) {
    if (event.type === 'LABEL_TRIGGERED') {
      return;
    }
    const eventDef = this.eventDefs().find(definition => definition.sourceSequencerBtnId === event.btnId);
    if (!eventDef) {
      return;
    }
    if (event.type === 'EVENT_ONCE_TRIGGERED') {
      const occurrence = this.createOccurrence(eventDef, false);
      this.store.dispatch(addOccurrence({ occurrence }));
      return;
    }

    if (event.type === 'EVENT_INDEFINITE_START') {
      const occurrence = this.createOccurrence(eventDef, true);
      this.store.dispatch(addOccurrence({ occurrence }));
      this.openOccurrenceByEventDef.set({ ...this.openOccurrenceByEventDef(), [eventDef.id]: occurrence.id });
      return;
    }

    if (event.type === 'EVENT_INDEFINITE_END') {
      this.closeOpenOccurrence(eventDef);
    }
  }

  private closeOpenOccurrence(eventDef: TimelineEventDef) {
    const occurrenceId = this.openOccurrenceByEventDef()[eventDef.id];
    if (!occurrenceId) {
      return;
    }
    const occurrence = this.occurrences().find(item => item.id === occurrenceId);
    if (!occurrence) {
      return;
    }

    const normalized = normalizeTiming(occurrence.startMs, this.timebase.currentTimeMs() + eventDef.postMs);
    this.store.dispatch(updateOccurrenceTiming({ id: occurrence.id, ...normalized, isOpen: false }));

    const nextMap = { ...this.openOccurrenceByEventDef() };
    delete nextMap[eventDef.id];
    this.openOccurrenceByEventDef.set(nextMap);
  }

  private createOccurrence(eventDef: TimelineEventDef, isOpen: boolean): TimelineOccurrence {
    const nowMs = this.timebase.currentTimeMs();
    const start = nowMs - (eventDef.preMs || TIMELINE_DEFAULT_PRE_MS);
    const rawEnd = isOpen ? start : nowMs + (eventDef.postMs || TIMELINE_DEFAULT_POST_MS);
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
      isOpen,
    };
  }

  private buildDefinitionsFromSequencer(): TimelineDefinitions {
    const btnList = this.sequencerPanelService.btnList();
    const eventDefs: TimelineDefinitions['eventDefs'] = btnList
      .filter(btn => btn.type === 'event')
      .map((btn): TimelineEventDef => ({
        id: btn.id,
        sourceSequencerBtnId: btn.id,
        name: btn.name,
        timingMode: btn.eventProps.kind === 'indefinite' ? 'indefinite' : 'once',
        preMs: btn.eventProps.preMs || TIMELINE_DEFAULT_PRE_MS,
        postMs: btn.eventProps.postMs || TIMELINE_DEFAULT_POST_MS,
      }));
    const labelDefs: TimelineDefinitions['labelDefs'] = btnList
      .filter(btn => btn.type === 'label')
      .map(btn => ({
        id: btn.id,
        sourceSequencerBtnId: btn.id,
        name: btn.name,
        behavior: btn.labelProps.mode,
      }));

    return { eventDefs, labelDefs };
  }

  private clampPlaybackEnd(endMs: number): number {
    const durationMs = this.videoService.durationMs();
    if (!durationMs) {
      return endMs;
    }
    return Math.min(endMs, durationMs);
  }
}
