import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TimelineFacadeService } from './timeline-facade.service';
import { TimebaseService } from './timebase.service';
import { VideoService } from './video.service';
import { initialTimelineState } from '../../store/Timeline/timeline.reducer';
import * as TimelineActions from '../../store/Timeline/timeline.actions';
import { selectTimelineAutoFollow, selectTimelineEventDefs, selectTimelineOccurrences, selectTimelineScroll, selectTimelineSelectionIds } from '../../store/Timeline/timeline.selectors';

class MockTimebaseService {
  readonly current = signal(5000);
  readonly mode = signal<'video' | 'clock'>('clock');
  readonly currentTimeMs = this.current.asReadonly();
  play = jasmine.createSpy('play');
  pause = jasmine.createSpy('pause');
  seekTo = jasmine.createSpy('seekTo');
}

class MockVideoService {
  readonly durationMs = signal(0);
}

describe('TimelineFacadeService', () => {
  let service: TimelineFacadeService;
  let store: MockStore;
  let timebase: MockTimebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimelineFacadeService,
        provideMockStore({ initialState: { timelineState: initialTimelineState } }),
        { provide: TimebaseService, useClass: MockTimebaseService },
        { provide: VideoService, useClass: MockVideoService },
      ],
    });

    store = TestBed.inject(MockStore);
    timebase = TestBed.inject(TimebaseService) as unknown as MockTimebaseService;
    store.overrideSelector(selectTimelineEventDefs, [
      { id: 'evt_once', name: 'Once', timingMode: 'once', preMs: 1000, postMs: 1000 },
      { id: 'evt_indef', name: 'Indef', timingMode: 'indefinite', preMs: 1000, postMs: 1000 },
    ]);
    store.overrideSelector(selectTimelineOccurrences, [
      { id: 'occ_ref', eventDefId: 'evt_once', startMs: 2000, endMs: 2600, labelIds: [], createdAtIso: '', updatedAtIso: '' },
      { id: 'occ_open', eventDefId: 'evt_indef', startMs: 4000, endMs: 4200, labelIds: [], createdAtIso: '', updatedAtIso: '', isOpen: true },
    ]);
    store.overrideSelector(selectTimelineSelectionIds, ['occ_ref']);
    store.overrideSelector(selectTimelineScroll, { scrollX: 0, scrollY: 0 });
    store.overrideSelector(selectTimelineAutoFollow, true);
    store.refreshState();

    service = TestBed.inject(TimelineFacadeService);
    spyOn(store, 'dispatch');
  });

  it('creates snapped occurrence on MarkIn once', () => {
    timebase.current.set(5050);
    service.markIn('evt_once');
    expect(store.dispatch).toHaveBeenCalled();
    const action = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0] as ReturnType<typeof TimelineActions.addOccurrence>;
    expect(action.type).toBe(TimelineActions.addOccurrence.type);
    expect(action.occurrence.startMs % 100).toBe(0);
    expect(action.occurrence.endMs).toBeGreaterThan(action.occurrence.startMs);
    expect(action.occurrence.isOpen).toBeFalse();
  });

  it('creates indefinite occurrence and closes it on MarkOut', () => {
    service.markIn('evt_indef');
    const addAction = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0] as ReturnType<typeof TimelineActions.addOccurrence>;
    expect(addAction.occurrence.isOpen).toBeTrue();

    const generatedId = addAction.occurrence.id;
    store.overrideSelector(selectTimelineOccurrences, [
      { ...addAction.occurrence, id: generatedId, eventDefId: 'evt_indef', startMs: 4000, endMs: 4200, isOpen: true },
    ]);
    store.refreshState();
    timebase.current.set(7000);
    service.markOut('evt_indef');
    const updateAction = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0] as ReturnType<typeof TimelineActions.updateOccurrenceTiming>;
    expect(updateAction.type).toBe(TimelineActions.updateOccurrenceTiming.type);
    expect(updateAction.endMs).toBeGreaterThanOrEqual(updateAction.startMs);
    expect(updateAction.isOpen).toBeFalse();
  });

  it('dispatches shift/align/undo actions', () => {
    service.shift(1000, 'ALL');
    service.align('occ_ref');
    service.undoShiftOrAlign();
    const actionTypes = (store.dispatch as jasmine.Spy).calls.allArgs().map(args => args[0].type);
    expect(actionTypes).toContain(TimelineActions.shiftTimeline.type);
    expect(actionTypes).toContain(TimelineActions.alignToCurrentTimebase.type);
    expect(actionTypes).toContain(TimelineActions.undoLastShiftOrAlign.type);
  });

  it('plays selection in sequence', () => {
    service.playSelection();
    expect(timebase.seekTo).toHaveBeenCalled();
    expect(timebase.play).toHaveBeenCalled();
  });
});
