import { TIMELINE_MIN_DURATION_MS } from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineState, initialTimelineState, timelineReducer } from './timeline.reducer';
import {
  timelineRuntimeIndefiniteEnd,
  timelineRuntimeIndefiniteStart,
  timelineRuntimeLabelApply,
  timelineRuntimeLabelRemove,
  timelineRuntimeOnceTriggered,
  toggleOccurrenceLabel,
} from './timeline.actions';

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

  it('creates closed occurrence on runtime once trigger', () => {
    const next = timelineReducer(
      baseState,
      timelineRuntimeOnceTriggered({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: [] }),
    );

    expect(next.occurrences.length).toBe(1);
    expect(next.occurrences[0].isOpen).toBeFalse();
    expect(next.occurrences[0].startMs).toBe(4000);
    expect(next.occurrences[0].endMs).toBe(5700);
  });

  it('creates open occurrence and records mapping on runtime start', () => {
    const next = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: [] }),
    );

    expect(next.occurrences.length).toBe(1);
    expect(next.occurrences[0].isOpen).toBeTrue();
    expect(next.occurrences[0].startMs).toBe(4000);
    expect(next.openOccurrenceByEventBtnId['evt-1']).toBe(next.occurrences[0].id);
  });

  it('closes open occurrence and removes mapping on runtime end', () => {
    const started = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: [] }),
    );
    const startedOccurrence = started.occurrences[0];

    const closed = timelineReducer(
      started,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 6000, timestamp: 2, activeLabelBtnIds: [] }),
    );

    const updated = closed.occurrences.find(item => item.id === startedOccurrence.id);
    expect(updated?.isOpen).toBeFalse();
    expect(updated?.endMs).toBeGreaterThanOrEqual(startedOccurrence.startMs + TIMELINE_MIN_DURATION_MS);
    expect(closed.openOccurrenceByEventBtnId['evt-1']).toBeUndefined();
  });

  it('ignores duplicate start while occurrence is already open', () => {
    const started = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: [] }),
    );

    const duplicate = timelineReducer(
      started,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5100, timestamp: 2, activeLabelBtnIds: [] }),
    );

    expect(duplicate.occurrences.length).toBe(1);
  });

  it('ignores end when no open occurrence exists', () => {
    const ended = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 6000, timestamp: 2, activeLabelBtnIds: [] }),
    );

    expect(ended).toEqual(baseState);
  });

  it('handles multiple start/end pairs deterministically', () => {
    const startedEvt1 = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: [] }),
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
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-2', atMs: 5200, timestamp: 2, activeLabelBtnIds: [] }),
    );
    const closedEvt1 = timelineReducer(
      startedEvt2,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 5600, timestamp: 3, activeLabelBtnIds: [] }),
    );
    const closedEvt2 = timelineReducer(
      closedEvt1,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-2', atMs: 5800, timestamp: 4, activeLabelBtnIds: [] }),
    );

    expect(closedEvt2.openOccurrenceByEventBtnId['evt-1']).toBeUndefined();
    expect(closedEvt2.openOccurrenceByEventBtnId['evt-2']).toBeUndefined();
    expect(closedEvt2.occurrences.every(item => item.isOpen === false)).toBeTrue();
  });
});


describe('timelineReducer label toggle', () => {
  it('adds and removes a label id on the targeted occurrence', () => {
    const stateWithOccurrence: TimelineState = {
      ...baseState,
      occurrences: [
        {
          id: 'occ-1',
          eventDefId: 'def-1',
          startMs: 0,
          endMs: 1000,
          labelIds: [],
          createdAtIso: '2024-01-01T00:00:00.000Z',
          updatedAtIso: '2024-01-01T00:00:00.000Z',
          isOpen: false,
        },
      ],
    };

    const added = timelineReducer(
      stateWithOccurrence,
      toggleOccurrenceLabel({ occurrenceId: 'occ-1', labelId: 'label-1' }),
    );
    expect(added.occurrences[0].labelIds).toEqual(['label-1']);

    const removed = timelineReducer(
      added,
      toggleOccurrenceLabel({ occurrenceId: 'occ-1', labelId: 'label-1' }),
    );
    expect(removed.occurrences[0].labelIds).toEqual([]);
  });
});


describe('timelineReducer runtime label actions', () => {
  const baseWithDefs: TimelineState = {
    ...baseState,
    definitions: {
      ...baseState.definitions,
      eventDefs: [
        ...baseState.definitions.eventDefs,
        {
          id: 'def-2',
          sourceSequencerBtnId: 'evt-2',
          name: 'Event 2',
          timingMode: 'once',
          preMs: 0,
          postMs: 0,
        },
      ],
    },
  };

  it('APPLY adds label on open occurrence', () => {
    const state: TimelineState = {
      ...baseWithDefs,
      occurrences: [
        {
          id: 'occ-open',
          eventDefId: 'def-1',
          startMs: 100,
          endMs: 300,
          labelIds: [],
          createdAtIso: '2024-01-01T00:00:00.000Z',
          updatedAtIso: '2024-01-01T00:00:00.000Z',
          isOpen: true,
        },
      ],
      openOccurrenceByEventBtnId: {
        'evt-1': 'occ-open',
      },
    };

    const next = timelineReducer(
      state,
      timelineRuntimeLabelApply({ labelBtnId: 'lbl-1', targetEventBtnIds: ['evt-1'], atMs: 200, timestamp: 1 }),
    );

    expect(next.occurrences[0].labelIds).toEqual(['lbl-1']);
  });

  it('REMOVE removes label from open occurrence', () => {
    const state: TimelineState = {
      ...baseWithDefs,
      occurrences: [
        {
          id: 'occ-open',
          eventDefId: 'def-1',
          startMs: 100,
          endMs: 300,
          labelIds: ['lbl-1'],
          createdAtIso: '2024-01-01T00:00:00.000Z',
          updatedAtIso: '2024-01-01T00:00:00.000Z',
          isOpen: true,
        },
      ],
      openOccurrenceByEventBtnId: {
        'evt-1': 'occ-open',
      },
    };

    const next = timelineReducer(
      state,
      timelineRuntimeLabelRemove({ labelBtnId: 'lbl-1', targetEventBtnIds: ['evt-1'], atMs: 200, timestamp: 1 }),
    );

    expect(next.occurrences[0].labelIds).toEqual([]);
  });

  it('APPLY does not duplicate label', () => {
    const state: TimelineState = {
      ...baseWithDefs,
      occurrences: [
        {
          id: 'occ-open',
          eventDefId: 'def-1',
          startMs: 100,
          endMs: 300,
          labelIds: ['lbl-1'],
          createdAtIso: '2024-01-01T00:00:00.000Z',
          updatedAtIso: '2024-01-01T00:00:00.000Z',
          isOpen: true,
        },
      ],
      openOccurrenceByEventBtnId: {
        'evt-1': 'occ-open',
      },
    };

    const next = timelineReducer(
      state,
      timelineRuntimeLabelApply({ labelBtnId: 'lbl-1', targetEventBtnIds: ['evt-1'], atMs: 200, timestamp: 1 }),
    );

    expect(next.occurrences[0].labelIds).toEqual(['lbl-1']);
  });

  it('fallback intersects by atMs and picks latest occurrence', () => {
    const state: TimelineState = {
      ...baseWithDefs,
      occurrences: [
        {
          id: 'occ-old',
          eventDefId: 'def-1',
          startMs: 100,
          endMs: 500,
          labelIds: [],
          createdAtIso: '2024-01-01T00:00:00.000Z',
          updatedAtIso: '2024-01-01T00:00:00.000Z',
          isOpen: false,
        },
        {
          id: 'occ-new',
          eventDefId: 'def-1',
          startMs: 200,
          endMs: 600,
          labelIds: [],
          createdAtIso: '2024-01-01T00:00:00.000Z',
          updatedAtIso: '2024-01-01T00:00:00.000Z',
          isOpen: false,
        },
      ],
      openOccurrenceByEventBtnId: {},
    };

    const next = timelineReducer(
      state,
      timelineRuntimeLabelApply({ labelBtnId: 'lbl-2', targetEventBtnIds: ['evt-1'], atMs: 300, timestamp: 1 }),
    );

    const oldOccurrence = next.occurrences.find(item => item.id === 'occ-old');
    const newOccurrence = next.occurrences.find(item => item.id === 'occ-new');

    expect(oldOccurrence?.labelIds).toEqual([]);
    expect(newOccurrence?.labelIds).toEqual(['lbl-2']);
  });
});


describe('timelineReducer active indefinite labels merge on runtime events', () => {
  it('ONCE includes active indefinite labels at creation', () => {
    const next = timelineReducer(
      baseState,
      timelineRuntimeOnceTriggered({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: ['lbl-1', 'lbl-2'] }),
    );

    expect(next.occurrences[0].labelIds).toEqual(['lbl-1', 'lbl-2']);
  });

  it('INDEFINITE START includes active indefinite labels at open', () => {
    const next = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: ['lbl-1'] }),
    );

    expect(next.occurrences[0].labelIds).toEqual(['lbl-1']);
  });

  it('INDEFINITE END merges active indefinite labels with existing labels', () => {
    const started = timelineReducer(
      baseState,
      timelineRuntimeIndefiniteStart({ eventBtnId: 'evt-1', atMs: 5000, timestamp: 1, activeLabelBtnIds: ['lbl-existing'] }),
    );

    const ended = timelineReducer(
      started,
      timelineRuntimeIndefiniteEnd({ eventBtnId: 'evt-1', atMs: 6000, timestamp: 2, activeLabelBtnIds: ['lbl-existing', 'lbl-new'] }),
    );

    expect(ended.occurrences[0].labelIds).toEqual(['lbl-existing', 'lbl-new']);
  });
});
