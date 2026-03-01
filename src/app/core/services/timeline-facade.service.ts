import { Injectable, Signal, computed, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TimebaseService } from './timebase.service';
import { VideoService } from './video.service';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { EventBtn } from '../../interfaces/sequencer-btn.interface';
import {
  TIMELINE_BUFFER_WORK_DURATION_MS,
  TIMELINE_DEFAULT_POST_MS,
  TIMELINE_DEFAULT_PRE_MS,
} from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineDefinitions, TimelineEventDef, TimelineShiftScope } from '../../interfaces/timeline/timeline.interface';
import {
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
  selectTimelineAllOccurrencesSelected,
  selectTimelineAutoFollow,
  selectTimelineCanUndoShiftAlign,
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

  readonly eventDefs = this.store.selectSignal(selectTimelineEventDefs);
  readonly occurrences = this.store.selectSignal(selectTimelineOccurrences);
  readonly selectionIds = this.store.selectSignal(selectTimelineSelectionIds);
  readonly uiScroll = this.store.selectSignal(selectTimelineScroll);
  readonly autoFollow = this.store.selectSignal(selectTimelineAutoFollow);
  readonly canUndoShiftOrAlign = this.store.selectSignal(selectTimelineCanUndoShiftAlign);
  readonly allOccurrencesSelected = this.store.selectSignal(selectTimelineAllOccurrencesSelected);

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

  private playSelectionTimer?: number;

  constructor() {
    effect(() => {
      const definitions = this.buildDefinitionsFromSequencer();
      this.store.dispatch(upsertDefinitions({ definitions }));
    });
  }

  setSelection(ids: string[]) {
    this.store.dispatch(setSelection({ ids }));
  }

  toggleAllSelections() {
    if (this.allOccurrencesSelected()) {
      this.setSelection([]);
      return;
    }

    this.setSelection(this.occurrences().map(occurrence => occurrence.id));
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

  private buildDefinitionsFromSequencer(): TimelineDefinitions {
    const btnList = this.sequencerPanelService.btnList();
    const eventDefs: TimelineDefinitions['eventDefs'] = btnList
      .filter((btn): btn is EventBtn => btn.type === 'event')
      .map((btn): TimelineEventDef => ({
        id: btn.id,
        sourceSequencerBtnId: btn.id,
        name: btn.name,
        colorHex: btn.colorHex,
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
