import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TimelineState } from './timeline.reducer';

export const selectTimelineState = createFeatureSelector<TimelineState>('timelineState');

export const selectTimelineDefinitions = createSelector(selectTimelineState, state => state.definitions);
export const selectTimelineEventDefs = createSelector(selectTimelineDefinitions, definitions => definitions.eventDefs);
export const selectTimelineLabelDefs = createSelector(selectTimelineDefinitions, definitions => definitions.labelDefs);
export const selectTimelineOccurrences = createSelector(selectTimelineState, state => state.occurrences);
export const selectTimelineUi = createSelector(selectTimelineState, state => state.ui);
export const selectTimelineSelectionIds = createSelector(selectTimelineUi, ui => ui.selectedOccurrenceIds);
export const selectTimelineAutoFollow = createSelector(selectTimelineUi, ui => ui.autoFollow);
export const selectTimelineScroll = createSelector(selectTimelineUi, ui => ({ scrollX: ui.scrollX, scrollY: ui.scrollY }));
export const selectTimelineCanUndoShiftAlign = createSelector(selectTimelineState, state => state.lastShiftDeltaMs !== null);
export const selectTimelineCanUndoRemove = createSelector(selectTimelineState, state => state.lastRemoved !== null);
export const selectTimelineAllOccurrencesSelected = createSelector(
  selectTimelineOccurrences,
  selectTimelineSelectionIds,
  (occurrences, selectionIds) => occurrences.length > 0 && selectionIds.length === occurrences.length,
);

export const selectTimelineLabelDefsById = createSelector(selectTimelineLabelDefs, labelDefs =>
  labelDefs.reduce<Record<string, string>>((accumulator, definition) => {
    accumulator[definition.id] = definition.name;
    return accumulator;
  }, {}),
);

export const selectTimelineName = createSelector(selectTimelineState, state => state.meta.timelineName ?? 'Timeline');
