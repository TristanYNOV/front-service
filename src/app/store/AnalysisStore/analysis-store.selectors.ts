import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalysisStoreState } from './analysis-store.reducer';
import { selectTimelineOccurrences } from '../Timeline/timeline.selectors';

export const selectAnalysisStoreState = createFeatureSelector<AnalysisStoreState>('analysisStoreState');

export const selectAnalysisStorePanelState = createSelector(selectAnalysisStoreState, state => state.panel);
export const selectAnalysisStoreTimelineState = createSelector(selectAnalysisStoreState, state => state.timeline);

export const selectCurrentPanelResourceId = createSelector(
  selectAnalysisStorePanelState,
  panelState => panelState.currentResourceId,
);

export const selectCurrentTimelineResourceId = createSelector(
  selectAnalysisStoreTimelineState,
  timelineState => timelineState.currentResourceId,
);

export const selectHasCurrentPanelContent = createSelector(
  selectAnalysisStorePanelState,
  panelState => !!panelState.currentContent && panelState.currentContent.btnList.length > 0,
);

export const selectHasCurrentTimelineContent = createSelector(
  selectTimelineOccurrences,
  occurrences => occurrences.length > 0,
);
