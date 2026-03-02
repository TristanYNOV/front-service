import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { SequencerTimelineBridgeService } from './sequencer-timeline-bridge.service';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { TimebaseService } from './timebase.service';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { initialTimelineState } from '../../store/Timeline/timeline.reducer';
import {
  timelineRuntimeIndefiniteEnd,
  timelineRuntimeIndefiniteStart,
  timelineRuntimeLabelApply,
  timelineRuntimeLabelRemove,
  timelineRuntimeOnceTriggered,
} from '../../store/Timeline/timeline.actions';
import { SequencerBtn } from '../../interfaces/sequencer-btn.interface';

class MockSequencerRuntimeService {
  readonly recentRuntimeEvents = signal<
    {
      type: 'EVENT_ONCE_TRIGGERED' | 'EVENT_INDEFINITE_START' | 'EVENT_INDEFINITE_END' | 'LABEL_TRIGGERED';
      btnId: string;
      timestamp: number;
      seq: number;
      applyToEventBtnIds?: string[];
    }[]
  >([]);
  readonly activeIndefiniteIds = signal<string[]>([]);

  getActiveIndefiniteLabelIds() {
    return this.activeIndefiniteIds();
  }
}

class MockTimebaseService {
  readonly currentTimeMs = signal(4200);
}

class MockSequencerPanelService {
  private readonly btnById: Record<string, SequencerBtn> = {
    'lbl-once': { id: 'lbl-once', name: 'Label once', type: 'label', labelProps: { mode: 'once' } },
    'lbl-indef': { id: 'lbl-indef', name: 'Label indef', type: 'label', labelProps: { mode: 'indefinite' } },
    'evt-1': { id: 'evt-1', name: 'Event 1', type: 'event', eventProps: { kind: 'indefinite', preMs: 0, postMs: 0 } },
  };

  getBtnById(id: string) {
    return this.btnById[id];
  }
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
        { provide: SequencerPanelService, useClass: MockSequencerPanelService },
      ],
    });

    runtime = TestBed.inject(SequencerRuntimeService) as unknown as MockSequencerRuntimeService;
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    TestBed.inject(SequencerTimelineBridgeService);
  });

  it('dispatches runtime start/end actions in seq order once', () => {
    runtime.activeIndefiniteIds.set([]);
    runtime.recentRuntimeEvents.set([
      { type: 'EVENT_INDEFINITE_END', btnId: 'evt-1', timestamp: 30, seq: 4 },
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-once', timestamp: 15, seq: 3 },
      { type: 'EVENT_INDEFINITE_START', btnId: 'evt-1', timestamp: 20, seq: 2 },
      { type: 'EVENT_ONCE_TRIGGERED', btnId: 'evt-2', timestamp: 10, seq: 1 },
    ]);

    const actions = (store.dispatch as jasmine.Spy).calls.allArgs().map(call => call[0]);
    expect(actions[0]).toEqual(timelineRuntimeOnceTriggered({ eventBtnId: 'evt-2', atMs: 4200, timestamp: 10, activeLabelBtnIds: [] }));
    expect(actions[1]).toEqual(timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 20, activeLabelBtnIds: [] }));
    expect(actions[2]).toEqual(timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 30, activeLabelBtnIds: [] }));
    expect(actions.length).toBe(3);

    (store.dispatch as jasmine.Spy).calls.reset();
    runtime.recentRuntimeEvents.set([
      { type: 'EVENT_INDEFINITE_END', btnId: 'evt-1', timestamp: 30, seq: 4 },
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-once', timestamp: 15, seq: 3 },
      { type: 'EVENT_INDEFINITE_START', btnId: 'evt-1', timestamp: 20, seq: 2 },
      { type: 'EVENT_ONCE_TRIGGERED', btnId: 'evt-2', timestamp: 10, seq: 1 },
    ]);

    expect(store.dispatch).not.toHaveBeenCalled();
  });



  it('includes activeLabelBtnIds in event runtime dispatches', () => {
    runtime.activeIndefiniteIds.set(['lbl-indef']);
    runtime.recentRuntimeEvents.set([
      { type: 'EVENT_ONCE_TRIGGERED', btnId: 'evt-1', timestamp: 10, seq: 1 },
      { type: 'EVENT_INDEFINITE_START', btnId: 'evt-1', timestamp: 20, seq: 2 },
      { type: 'EVENT_INDEFINITE_END', btnId: 'evt-1', timestamp: 30, seq: 3 },
    ]);

    expect(store.dispatch).toHaveBeenCalledWith(
      timelineRuntimeOnceTriggered({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 10, activeLabelBtnIds: ['lbl-indef'] }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 20, activeLabelBtnIds: ['lbl-indef'] }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 4200, timestamp: 30, activeLabelBtnIds: ['lbl-indef'] }),
    );
  });

  it('dispatches APPLY for LABEL_TRIGGERED once', () => {
    runtime.recentRuntimeEvents.set([
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-once', timestamp: 10, seq: 1, applyToEventBtnIds: ['evt-1'] },
    ]);

    expect(store.dispatch).toHaveBeenCalledWith(
      timelineRuntimeLabelApply({ labelBtnId: 'lbl-once', targetEventBtnIds: ['evt-1'], atMs: 4200, timestamp: 10 }),
    );
  });

  it('dispatches APPLY for LABEL_TRIGGERED indefinite when active', () => {
    runtime.activeIndefiniteIds.set(['lbl-indef']);
    runtime.recentRuntimeEvents.set([
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-indef', timestamp: 20, seq: 1, applyToEventBtnIds: ['evt-1'] },
    ]);

    expect(store.dispatch).toHaveBeenCalledWith(
      timelineRuntimeLabelApply({ labelBtnId: 'lbl-indef', targetEventBtnIds: ['evt-1'], atMs: 4200, timestamp: 20 }),
    );
  });

  it('dispatches REMOVE for LABEL_TRIGGERED indefinite when inactive', () => {
    runtime.activeIndefiniteIds.set([]);
    runtime.recentRuntimeEvents.set([
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-indef', timestamp: 30, seq: 1, applyToEventBtnIds: ['evt-1'] },
    ]);

    expect(store.dispatch).toHaveBeenCalledWith(
      timelineRuntimeLabelRemove({ labelBtnId: 'lbl-indef', targetEventBtnIds: ['evt-1'], atMs: 4200, timestamp: 30 }),
    );
  });

  it('does not dispatch for LABEL_TRIGGERED when applyToEventBtnIds is empty', () => {
    runtime.recentRuntimeEvents.set([
      { type: 'LABEL_TRIGGERED', btnId: 'lbl-once', timestamp: 40, seq: 1, applyToEventBtnIds: [] },
    ]);

    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
