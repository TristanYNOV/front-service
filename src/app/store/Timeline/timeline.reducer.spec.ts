import { TIMELINE_MIN_DURATION_MS } from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineState, initialTimelineState, timelineReducer } from './timeline.reducer';
import { timelineRuntimeIndefiniteEnd, timelineRuntimeIndefiniteStart } from './timeline.actions';

const baseState: TimelineState = {
  ...initialTimelineState,
  definitions: {
    eventDefs: [
      {
        id: 'def-1',
        sourceSequencerBtnId: 'evt-1',
        name: 'Event 1',
        timingMode: 'indefinite',
        preMs: 1000,
        postMs: 700,
      },
    ],
    labelDefs: [],
  },
  occurrences: [],
  openOccurrenceByEventBtnId: {},
};

describe('timelineReducer runtime indefinite actions', () => {
  it('creates open occurrence and records mapping on runtime start', () => {
    const next = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1 }),
    );

    expect(next.occurrences.length).toBe(1);
    expect(next.occurrences[0].isOpen).toBeTrue();
    expect(next.occurrences[0].startMs).toBe(4000);
    expect(next.openOccurrenceByEventBtnId['evt-1']).toBe(next.occurrences[0].id);
  });

  it('closes open occurrence and removes mapping on runtime end', () => {
    const started = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1 }),
    );
    const startedOccurrence = started.occurrences[0];

    const closed = timelineReducer(
      started,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 6000, timestamp: 2 }),
    );

    const updated = closed.occurrences.find(item => item.id === startedOccurrence.id);
    expect(updated?.isOpen).toBeFalse();
    expect(updated?.endMs).toBeGreaterThanOrEqual(startedOccurrence.startMs + TIMELINE_MIN_DURATION_MS);
    expect(closed.openOccurrenceByEventBtnId['evt-1']).toBeUndefined();
  });

  it('ignores duplicate start while occurrence is already open', () => {
    const started = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1 }),
    );

    const duplicate = timelineReducer(
      started,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5100, timestamp: 2 }),
    );

    expect(duplicate.occurrences.length).toBe(1);
  });

  it('ignores end when no open occurrence exists', () => {
    const ended = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 6000, timestamp: 2 }),
    );

    expect(ended).toEqual(baseState);
  });

  it('handles multiple start/end pairs deterministically', () => {
    const startedEvt1 = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1 }),
    );
    const withEvt2Def: TimelineState = {
      ...startedEvt1,
      definitions: {
        ...startedEvt1.definitions,
        eventDefs: [
          ...startedEvt1.definitions.eventDefs,
          { id: 'def-2', sourceSequencerBtnId: 'evt-2', name: 'Event 2', timingMode: 'indefinite', preMs: 800, postMs: 400 },
        ],
      },
    };

    const startedEvt2 = timelineReducer(
      withEvt2Def,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-2', atMs: 5200, timestamp: 2 }),
    );
    const closedEvt1 = timelineReducer(
      startedEvt2,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 5600, timestamp: 3 }),
    );
    const closedEvt2 = timelineReducer(
      closedEvt1,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-2', atMs: 5800, timestamp: 4 }),
    );

    expect(closedEvt2.openOccurrenceByEventBtnId['evt-1']).toBeUndefined();
    expect(closedEvt2.openOccurrenceByEventBtnId['evt-2']).toBeUndefined();
    expect(closedEvt2.occurrences.every(item => item.isOpen === false)).toBeTrue();
  });
});
