import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TimelineFacadeService } from './timeline-facade.service';
import { TimebaseService } from './timebase.service';
import { VideoService } from './video.service';
import { initialTimelineState } from '../../store/Timeline/timeline.reducer';
import * as TimelineActions from '../../store/Timeline/timeline.actions';
import {
  selectTimelineAutoFollow,
  selectTimelineEventDefs,
  selectTimelineOccurrences,
  selectTimelineScroll,
  selectTimelineSelectionIds,
} from '../../store/Timeline/timeline.selectors';
import { SequencerPanelService } from '../service/sequencer-panel.service';

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

class MockSequencerPanelService {
  readonly btnList = signal([
    { id: 'evt_once', name: 'Once', type: 'event', eventProps: { kind: 'limited', preMs: 1000, postMs: 800 } },
    { id: 'evt_indef', name: 'Indef', type: 'event', eventProps: { kind: 'indefinite', preMs: 1000, postMs: 1000 } },
    { id: 'lbl_note', name: 'Note', type: 'label', labelProps: { mode: 'once' } },
  ] as const);
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
        { provide: SequencerPanelService, useClass: MockSequencerPanelService },
      ],
    });

    store = TestBed.inject(MockStore);
    timebase = TestBed.inject(TimebaseService) as unknown as MockTimebaseService;

    store.overrideSelector(selectTimelineEventDefs, [
      { id: 'evt_once', sourceSequencerBtnId: 'evt_once', name: 'Once', timingMode: 'once', preMs: 1000, postMs: 800 },
      { id: 'evt_indef', sourceSequencerBtnId: 'evt_indef', name: 'Indef', timingMode: 'indefinite', preMs: 1000, postMs: 1000 },
    ]);
    store.overrideSelector(selectTimelineOccurrences, [
      { id: 'occ_open', eventDefId: 'evt_indef', startMs: 4000, endMs: 4200, labelIds: [], createdAtIso: '', updatedAtIso: '', isOpen: true },
    ]);
    store.overrideSelector(selectTimelineSelectionIds, ['occ_open']);
    store.overrideSelector(selectTimelineScroll, { scrollX: 0, scrollY: 0 });
    store.overrideSelector(selectTimelineAutoFollow, true);
    store.refreshState();

    spyOn(store, 'dispatch');
    service = TestBed.inject(TimelineFacadeService);
  });

  it('syncs definitions from sequencer panel source', () => {
    const actionTypes = (store.dispatch as jasmine.Spy).calls.allArgs().map(args => args[0].type);
    expect(actionTypes).toContain(TimelineActions.upsertDefinitions.type);
  });



  it('dispatches shift/align/undo actions', () => {
    service.shift(1000, 'ALL');
    service.align('occ_open');
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
