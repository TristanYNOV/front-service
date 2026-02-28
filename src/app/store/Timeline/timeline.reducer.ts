import { createReducer, on } from '@ngrx/store';
import {
  TIMELINE_SCHEMA_VERSION,
} from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineMetadata, TimelineOccurrence, TimelineUiState } from '../../interfaces/timeline/timeline.interface';
import {
  addLabelToSelection,
  addOccurrence,
  alignToCurrentTimebase,
  initTimeline,
  removeLabelFromSelection,
  removeOccurrence,
  setAutoFollow,
  setSelection,
  setUiScroll,
  shiftTimeline,
  undoLastShiftOrAlign,
  updateOccurrenceTiming,
  upsertDefinitions,
} from './timeline.actions';
import { normalizeTiming, shiftOccurrences } from '../../utils/timeline/timeline-time.utils';

export interface TimelineState {
  schemaVersion: string;
  meta: TimelineMetadata;
  definitions: {
    eventDefs: { id: string; name: string; timingMode: 'once' | 'indefinite'; preMs: number; postMs: number }[];
    labelDefs: { id: string; name: string; behavior: 'once' | 'indefinite' }[];
  };
  occurrences: TimelineOccurrence[];
  ui: TimelineUiState;
  lastShiftDeltaMs: number | null;
}

export const initialTimelineState: TimelineState = {
  schemaVersion: TIMELINE_SCHEMA_VERSION,
  meta: {
    analysisName: 'Analyse locale',
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    userId: 'local-user',
  },
  definitions: {
    eventDefs: [],
    labelDefs: [],
  },
  occurrences: [],
  ui: {
    scrollX: 0,
    scrollY: 0,
    selectedOccurrenceIds: [],
    autoFollow: true,
  },
  lastShiftDeltaMs: null,
};

export const timelineReducer = createReducer(
  initialTimelineState,
  on(initTimeline, (state, payload) => ({ ...state, ...payload, ui: { ...state.ui }, lastShiftDeltaMs: null })),
  on(upsertDefinitions, (state, { definitions }) => ({ ...state, definitions })),
  on(addOccurrence, (state, { occurrence }) => ({ ...state, occurrences: [...state.occurrences, occurrence] })),
  on(updateOccurrenceTiming, (state, { id, startMs, endMs, isOpen }) => ({
    ...state,
    occurrences: state.occurrences.map(occurrence => {
      if (occurrence.id !== id) {
        return occurrence;
      }
      const normalized = normalizeTiming(startMs, endMs);
      return {
        ...occurrence,
        ...normalized,
        isOpen,
        updatedAtIso: new Date().toISOString(),
      };
    }),
  })),
  on(removeOccurrence, (state, { id }) => ({
    ...state,
    occurrences: state.occurrences.filter(occurrence => occurrence.id !== id),
    ui: {
      ...state.ui,
      selectedOccurrenceIds: state.ui.selectedOccurrenceIds.filter(selectedId => selectedId !== id),
    },
  })),
  on(setSelection, (state, { ids }) => ({ ...state, ui: { ...state.ui, selectedOccurrenceIds: ids } })),
  on(setUiScroll, (state, { scrollX, scrollY }) => ({ ...state, ui: { ...state.ui, scrollX, scrollY } })),
  on(setAutoFollow, (state, { enabled }) => ({ ...state, ui: { ...state.ui, autoFollow: enabled } })),
  on(addLabelToSelection, (state, { labelId }) => ({
    ...state,
    occurrences: state.occurrences.map(occurrence =>
      state.ui.selectedOccurrenceIds.includes(occurrence.id) && !occurrence.labelIds.includes(labelId)
        ? { ...occurrence, labelIds: [...occurrence.labelIds, labelId], updatedAtIso: new Date().toISOString() }
        : occurrence,
    ),
  })),
  on(removeLabelFromSelection, (state, { labelId }) => ({
    ...state,
    occurrences: state.occurrences.map(occurrence =>
      state.ui.selectedOccurrenceIds.includes(occurrence.id)
        ? {
            ...occurrence,
            labelIds: occurrence.labelIds.filter(id => id !== labelId),
            updatedAtIso: new Date().toISOString(),
          }
        : occurrence,
    ),
  })),
  on(shiftTimeline, (state, { deltaMs, scope }) => ({
    ...state,
    occurrences: shiftOccurrences(state.occurrences, deltaMs, scope, state.ui.selectedOccurrenceIds),
    lastShiftDeltaMs: deltaMs,
  })),
  on(alignToCurrentTimebase, (state, { referenceOccurrenceId, currentTimeMs }) => {
    const referenceOccurrence = state.occurrences.find(occurrence => occurrence.id === referenceOccurrenceId);
    if (!referenceOccurrence) {
      return state;
    }
    const deltaMs = currentTimeMs - referenceOccurrence.startMs;
    return {
      ...state,
      occurrences: shiftOccurrences(state.occurrences, deltaMs, 'ALL', state.ui.selectedOccurrenceIds),
      lastShiftDeltaMs: deltaMs,
    };
  }),
  on(undoLastShiftOrAlign, state => {
    if (!state.lastShiftDeltaMs) {
      return state;
    }
    return {
      ...state,
      occurrences: shiftOccurrences(state.occurrences, -state.lastShiftDeltaMs, 'ALL', state.ui.selectedOccurrenceIds),
      lastShiftDeltaMs: null,
    };
  }),
);
