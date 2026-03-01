import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { SequencerTimelineBridgeService } from './sequencer-timeline-bridge.service';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { TimebaseService } from './timebase.service';
import { initialTimelineState } from '../../store/Timeline/timeline.reducer';
import { timelineRuntimeIndefiniteEnd, timelineRuntimeIndefiniteStart, timelineRuntimeOnceTriggered } from '../../store/Timeline/timeline.actions';

class MockSequencerRuntimeService {
  readonly recentRuntimeEvents = signal<
    { type: 'EVENT_ONCE_TRIGGERED' | 'EVENT_INDEFINITE_START' | 'EVENT_INDEFINITE_END' | 'LABEL_TRIGGERED'; btnId: string; timestamp: number; seq: number }[]
  >([]);
}

class MockTimebaseService {
  readonly currentTimeMs = signal(4200);
}

describe('SequencerTimelineBridgeService', () => {
  let runtime: MockSequencerRuntimeService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SequencerTimelineBridgeService,
        provideMockStore({ initialState: { timelineState: initialTimelineState } }),
        { provide: SequencerRuntimeService, useClass: MockSequencerRuntimeService },
        { provide: TimebaseService, useClass: MockTimebaseService },
      ],
    });

    runtime = TestBed.inject(SequencerRuntimeService) as unknown as MockSequencerRuntimeService;
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    TestBed.inject(SequencerTimelineBridgeService);
  });

  it('dispatches runtime start/end actions in seq order once', () => {
    runtime.recentRuntimeEvents.set([
      { type: 'EVENT_INDEFINITE_END', btnId: 'evt-1', timestamp: 30, seq: 4 },
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-1', timestamp: 15, seq: 3 },
      { type: 'EVENT_INDEFINITE_START', btnId: 'evt-1', timestamp: 20, seq: 2 },
      { type: 'EVENT_ONCE_TRIGGERED', btnId: 'evt-2', timestamp: 10, seq: 1 },
    ]);

    const actions = (store.dispatch as jasmine.Spy).calls.allArgs().map(call => call[0]);
    expect(actions[0]).toEqual(timelineRuntimeOnceTriggered({ eventBtnId: 'evt-2', atMs: 4200, timestamp: 10 }));
    expect(actions[1]).toEqual(timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 20 }));
    expect(actions[2]).toEqual(timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 30 }));
    expect(actions.length).toBe(3);

    (store.dispatch as jasmine.Spy).calls.reset();
    runtime.recentRuntimeEvents.set([
      { type: 'EVENT_INDEFINITE_END', btnId: 'evt-1', timestamp: 30, seq: 4 },
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-1', timestamp: 15, seq: 3 },
      { type: 'EVENT_INDEFINITE_START', btnId: 'evt-1', timestamp: 20, seq: 2 },
      { type: 'EVENT_ONCE_TRIGGERED', btnId: 'evt-2', timestamp: 10, seq: 1 },
    ]);

    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
