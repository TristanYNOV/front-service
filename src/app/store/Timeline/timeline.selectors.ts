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
