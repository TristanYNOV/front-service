import { Injectable, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { TimebaseService } from './timebase.service';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import {
  timelineRuntimeIndefiniteEnd,
  timelineRuntimeIndefiniteStart,
  timelineRuntimeLabelApply,
  timelineRuntimeLabelRemove,
  timelineRuntimeOnceTriggered,
} from '../../store/Timeline/timeline.actions';

@Injectable()
export class SequencerTimelineBridgeService {
  private readonly store = inject(Store);
  private readonly runtime = inject(SequencerRuntimeService);
  private readonly timebase = inject(TimebaseService);
  private readonly panelService = inject(SequencerPanelService);

  private lastProcessedSeq = 0;

  constructor() {
    effect(() => {
      const recentEvents = this.runtime.recentRuntimeEvents();
      const newEvents = recentEvents
        .filter(event => event.seq > this.lastProcessedSeq)
        .sort((left, right) => left.seq - right.seq);

      if (!newEvents.length) {
        return;
      }

      newEvents.forEach(event => {
        if (event.type === 'EVENT_ONCE_TRIGGERED') {
          this.store.dispatch(
            timelineRuntimeOnceTriggered({
              eventBtnId: event.btnId,
              atMs: this.timebase.currentTimeMs(),
              timestamp: event.timestamp,
              activeLabelBtnIds: this.runtime.getActiveIndefiniteLabelIds(),
            }),
          );
        }

        if (event.type === 'EVENT_INDEFINITE_START') {
          this.store.dispatch(
            timelineRuntimeIndefiniteStart({
              eventBtnId: event.btnId,
              atMs: this.timebase.currentTimeMs(),
              timestamp: event.timestamp,
              activeLabelBtnIds: this.runtime.getActiveIndefiniteLabelIds(),
            }),
          );
        }

        if (event.type === 'EVENT_INDEFINITE_END') {
          this.store.dispatch(
            timelineRuntimeIndefiniteEnd({
              eventBtnId: event.btnId,
              atMs: this.timebase.currentTimeMs(),
              timestamp: event.timestamp,
              activeLabelBtnIds: this.runtime.getActiveIndefiniteLabelIds(),
            }),
          );
        }

        if (event.type === 'LABEL_TRIGGERED') {
          const targetEventBtnIds = event.applyToEventBtnIds ?? [];
          if (!targetEventBtnIds.length) {
            return;
          }

          const labelBtn = this.panelService.getBtnById(event.btnId);
          if (!labelBtn || labelBtn.type !== 'label') {
            return;
          }

          const atMs = this.timebase.currentTimeMs();
          if (labelBtn.labelProps.mode === 'once') {
            this.store.dispatch(
              timelineRuntimeLabelApply({
                labelBtnId: event.btnId,
                targetEventBtnIds,
                atMs,
                timestamp: event.timestamp,
              }),
            );
            return;
          }

          const activeNow = this.runtime.activeIndefiniteIds().includes(event.btnId);
          this.store.dispatch(
            activeNow
              ? timelineRuntimeLabelApply({
                  labelBtnId: event.btnId,
                  targetEventBtnIds,
                  atMs,
                  timestamp: event.timestamp,
                })
              : timelineRuntimeLabelRemove({
                  labelBtnId: event.btnId,
                  targetEventBtnIds,
                  atMs,
                  timestamp: event.timestamp,
                }),
          );
        }
      });

      this.lastProcessedSeq = newEvents[newEvents.length - 1].seq;
    });
  }
}
