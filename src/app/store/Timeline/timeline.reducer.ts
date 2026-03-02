import { createReducer, on } from '@ngrx/store';
import {
  TIMELINE_DEFAULT_POST_MS,
  TIMELINE_DEFAULT_PRE_MS,
  TIMELINE_MIN_DURATION_MS,
  TIMELINE_SCHEMA_VERSION,
} from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineDefinitions, TimelineMetadata, TimelineOccurrence, TimelineUiState } from '../../interfaces/timeline/timeline.interface';
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
  toggleOccurrenceLabel,
  timelineRuntimeIndefiniteEnd,
  timelineRuntimeIndefiniteStart,
  timelineRuntimeLabelApply,
  timelineRuntimeLabelRemove,
  timelineRuntimeOnceTriggered,
  undoLastShiftOrAlign,
  updateOccurrenceTiming,
  upsertDefinitions,
} from './timeline.actions';
import { normalizeTiming, shiftOccurrences } from '../../utils/timeline/timeline-time.utils';

export interface TimelineState {
  schemaVersion: string;
  meta: TimelineMetadata;
  definitions: TimelineDefinitions;
  occurrences: TimelineOccurrence[];
  ui: TimelineUiState;
  lastShiftDeltaMs: number | null;
  openOccurrenceByEventBtnId: Record<string, string>;
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
  openOccurrenceByEventBtnId: {},
};

export const timelineReducer = createReducer(
  initialTimelineState,
  on(initTimeline, (state, payload) => ({
    ...state,
    ...payload,
    occurrences: payload.occurrences.map(occurrence => ({ ...occurrence, labelIds: occurrence.labelIds ?? [] })),
    ui: { ...state.ui },
    lastShiftDeltaMs: null,
    openOccurrenceByEventBtnId: {},
  })),
  on(upsertDefinitions, (state, { definitions }) => ({ ...state, definitions })),
  on(addOccurrence, (state, { occurrence }) => ({
    ...state,
    occurrences: [...state.occurrences, { ...occurrence, labelIds: occurrence.labelIds ?? [] }],
  })),
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
  on(toggleOccurrenceLabel, (state, { occurrenceId, labelId }) => ({
    ...state,
    occurrences: state.occurrences.map(occurrence => {
      if (occurrence.id !== occurrenceId) {
        return occurrence;
      }

      const hasLabel = occurrence.labelIds.includes(labelId);
      return {
        ...occurrence,
        labelIds: hasLabel ? occurrence.labelIds.filter(id => id !== labelId) : [...occurrence.labelIds, labelId],
        updatedAtIso: new Date().toISOString(),
      };
    }),
  })),
  on(timelineRuntimeLabelApply, (state, { labelBtnId, targetEventBtnIds, atMs }) =>
    applyRuntimeLabelChange(state, labelBtnId, targetEventBtnIds, atMs, 'apply'),
  ),
  on(timelineRuntimeLabelRemove, (state, { labelBtnId, targetEventBtnIds, atMs }) =>
    applyRuntimeLabelChange(state, labelBtnId, targetEventBtnIds, atMs, 'remove'),
  ),
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

  on(timelineRuntimeOnceTriggered, (state, { eventBtnId, atMs }) => {
    const eventDef = state.definitions.eventDefs.find(definition => definition.sourceSequencerBtnId === eventBtnId);
    const preMs = eventDef?.preMs ?? TIMELINE_DEFAULT_PRE_MS;
    const postMs = eventDef?.postMs ?? TIMELINE_DEFAULT_POST_MS;
    const normalized = normalizeTiming(Math.max(0, atMs - preMs), atMs + postMs);
    const endMs = Math.max(normalized.endMs, normalized.startMs + TIMELINE_MIN_DURATION_MS);
    const createdAtIso = new Date().toISOString();

    const occurrence: TimelineOccurrence = {
      id: `occ_${Math.random().toString(36).slice(2, 10)}`,
      eventDefId: eventDef?.id ?? eventBtnId,
      startMs: normalized.startMs,
      endMs,
      labelIds: [],
      createdAtIso,
      updatedAtIso: createdAtIso,
      isOpen: false,
    };

    return {
      ...state,
      occurrences: [...state.occurrences, occurrence],
    };
  }),
  on(timelineRuntimeIndefiniteStart, (state, { eventBtnId, atMs }) => {
    if (state.openOccurrenceByEventBtnId[eventBtnId]) {
      return state;
    }

    const eventDef = state.definitions.eventDefs.find(definition => definition.sourceSequencerBtnId === eventBtnId);
    const preMs = eventDef?.preMs ?? TIMELINE_DEFAULT_PRE_MS;
    const startMs = Math.max(0, atMs - preMs);
    const endMs = Math.max(startMs + TIMELINE_MIN_DURATION_MS, startMs);
    const createdAtIso = new Date().toISOString();
    const occurrenceId = `occ_${Math.random().toString(36).slice(2, 10)}`;
    const nextOccurrence: TimelineOccurrence = {
      id: occurrenceId,
      eventDefId: eventDef?.id ?? eventBtnId,
      startMs,
      endMs,
      labelIds: [],
      createdAtIso,
      updatedAtIso: createdAtIso,
      isOpen: true,
    };

    return {
      ...state,
      occurrences: [...state.occurrences, nextOccurrence],
      openOccurrenceByEventBtnId: {
        ...state.openOccurrenceByEventBtnId,
        [eventBtnId]: occurrenceId,
      },
    };
  }),
  on(timelineRuntimeIndefiniteEnd, (state, { eventBtnId, atMs }) => {
    const occurrenceId = state.openOccurrenceByEventBtnId[eventBtnId];
    if (!occurrenceId) {
      return state;
    }

    const occurrence = state.occurrences.find(item => item.id === occurrenceId);
    if (!occurrence) {
      const nextMap = { ...state.openOccurrenceByEventBtnId };
      delete nextMap[eventBtnId];
      return {
        ...state,
        openOccurrenceByEventBtnId: nextMap,
      };
    }

    const eventDef = state.definitions.eventDefs.find(definition => definition.sourceSequencerBtnId === eventBtnId);
    const postMs = eventDef?.postMs ?? TIMELINE_DEFAULT_POST_MS;
    const normalized = normalizeTiming(occurrence.startMs, atMs + postMs);
    const endMs = Math.max(normalized.endMs, occurrence.startMs + TIMELINE_MIN_DURATION_MS);
    const nextMap = { ...state.openOccurrenceByEventBtnId };
    delete nextMap[eventBtnId];

    return {
      ...state,
      occurrences: state.occurrences.map(item =>
        item.id === occurrenceId
          ? { ...item, startMs: normalized.startMs, endMs, isOpen: false, updatedAtIso: new Date().toISOString() }
          : item,
      ),
      openOccurrenceByEventBtnId: nextMap,
    };
  }),
);


type RuntimeLabelOperation = 'apply' | 'remove';

function applyRuntimeLabelChange(
  state: TimelineState,
  labelBtnId: string,
  targetEventBtnIds: string[],
  atMs: number,
  operation: RuntimeLabelOperation,
): TimelineState {
  if (!targetEventBtnIds.length) {
    return state;
  }

  const targetOccurrenceIds = Array.from(
    new Set(
      targetEventBtnIds
        .map(eventBtnId => resolveOccurrenceIdForEventBtnId(state, eventBtnId, atMs))
        .filter((occurrenceId): occurrenceId is string => Boolean(occurrenceId)),
    ),
  );

  if (!targetOccurrenceIds.length) {
    return state;
  }

  const targetOccurrenceIdsSet = new Set(targetOccurrenceIds);
  let hasChanges = false;

  const nextOccurrences = state.occurrences.map(occurrence => {
    if (!targetOccurrenceIdsSet.has(occurrence.id)) {
      return occurrence;
    }

    const hasLabel = occurrence.labelIds.includes(labelBtnId);
    if (operation === 'apply' && hasLabel) {
      return occurrence;
    }
    if (operation === 'remove' && !hasLabel) {
      return occurrence;
    }

    hasChanges = true;
    return {
      ...occurrence,
      labelIds:
        operation === 'apply'
          ? [...occurrence.labelIds, labelBtnId]
          : occurrence.labelIds.filter(labelId => labelId !== labelBtnId),
      updatedAtIso: new Date().toISOString(),
    };
  });

  if (!hasChanges) {
    return state;
  }

  return {
    ...state,
    occurrences: nextOccurrences,
  };
}

function resolveOccurrenceIdForEventBtnId(state: TimelineState, eventBtnId: string, atMs: number): string | undefined {
  const openOccurrenceId = state.openOccurrenceByEventBtnId[eventBtnId];
  if (openOccurrenceId && state.occurrences.some(occurrence => occurrence.id === openOccurrenceId)) {
    return openOccurrenceId;
  }

  const eventDef = state.definitions.eventDefs.find(definition => definition.sourceSequencerBtnId === eventBtnId);
  if (!eventDef) {
    return undefined;
  }

  const intersectingOccurrences = state.occurrences.filter(
    occurrence =>
      occurrence.eventDefId === eventDef.id &&
      occurrence.startMs <= atMs &&
      atMs <= occurrence.endMs,
  );

  if (!intersectingOccurrences.length) {
    return undefined;
  }

  const latestIntersectingOccurrence = intersectingOccurrences.reduce((latest, occurrence) => {
    if (!latest) {
      return occurrence;
    }

    if (occurrence.endMs > latest.endMs) {
      return occurrence;
    }

    if (occurrence.endMs === latest.endMs && occurrence.startMs > latest.startMs) {
      return occurrence;
    }

    return latest;
  }, intersectingOccurrences[0]);

  return latestIntersectingOccurrence.id;
}
