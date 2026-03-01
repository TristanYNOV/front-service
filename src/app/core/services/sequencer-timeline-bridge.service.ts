import { Injectable, effect, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { TimebaseService } from './timebase.service';
import { timelineRuntimeIndefiniteEnd, timelineRuntimeIndefiniteStart } from '../../store/Timeline/timeline.actions';

@Injectable()
export class SequencerTimelineBridgeService {
  private readonly store = inject(Store);
  private readonly runtime = inject(SequencerRuntimeService);
  private readonly timebase = inject(TimebaseService);

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
        if (event.type === 'EVENT_INDEFINITE_START') {
          this.store.dispatch(
            timelineRuntimeIndefiniteStart({
              eventBtnId: event.btnId,
              atMs: this.timebase.currentTimeMs(),
              timestamp: event.timestamp,
            }),
          );
        }

        if (event.type === 'EVENT_INDEFINITE_END') {
          this.store.dispatch(
            timelineRuntimeIndefiniteEnd({
              eventBtnId: event.btnId,
              atMs: this.timebase.currentTimeMs(),
              timestamp: event.timestamp,
            }),
          );
        }
      });

      this.lastProcessedSeq = newEvents[newEvents.length - 1].seq;
    });
  }
}
