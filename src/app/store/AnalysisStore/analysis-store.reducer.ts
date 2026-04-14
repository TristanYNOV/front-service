import { createReducer, on } from '@ngrx/store';
import { AnalysisStoreVisibility, PanelResourceResponse, TimelineResourceResponse } from '../../interfaces/analysis-store';
import { SequencerPanel } from '../../interfaces/sequencer-panel.interface';
import {
  analysisStoreExportTimeline,
  analysisStoreExportTimelineFailure,
  analysisStoreExportTimelineSuccess,
  analysisStoreHydratePanelFromValidatedPayload,
  analysisStoreHydrateTimelineResourceMeta,
  analysisStoreImportTimeline,
  analysisStoreImportTimelineFailure,
  analysisStoreImportTimelineSuccess,
  analysisStoreLoadRemoteTimeline,
  analysisStoreLoadRemoteTimelineFailure,
  analysisStoreLoadRemoteTimelineSuccess,
  analysisStoreLoadTimelineList,
  analysisStoreLoadTimelineListFailure,
  analysisStoreLoadTimelineListSuccess,
  analysisStoreSavePanel,
  analysisStoreSavePanelFailure,
  analysisStoreSavePanelSuccess,
  analysisStoreSaveTimeline,
  analysisStoreSaveTimelineFailure,
  analysisStoreSaveTimelineSuccess,
  analysisStoreSetCurrentPanel,
} from './analysis-store.actions';

export interface AnalysisStoreResourceMetaState {
  currentResourceId: string | null;
  title: string;
  description: string | null;
  visibility: AnalysisStoreVisibility;
  clubId: string | null;
  hasAnonymizedContent: boolean;
  lastSavedAt: string | null;
}

export interface AnalysisStoreState {
  panel: AnalysisStoreResourceMetaState & {
    currentContent: SequencerPanel | null;
    isSaving: boolean;
    error: string | null;
  };
  timeline: AnalysisStoreResourceMetaState & {
    resources: TimelineResourceResponse[];
    isLoadingList: boolean;
    isLoadingRemote: boolean;
    isImporting: boolean;
    isExporting: boolean;
    isSaving: boolean;
    error: string | null;
  };
}

const initialResourceMetaState: AnalysisStoreResourceMetaState = {
  currentResourceId: null,
  title: '',
  description: null,
  visibility: 'private',
  clubId: null,
  hasAnonymizedContent: false,
  lastSavedAt: null,
};

export const initialAnalysisStoreState: AnalysisStoreState = {
  panel: {
    ...initialResourceMetaState,
    title: 'My Panel',
    currentContent: null,
    isSaving: false,
    error: null,
  },
  timeline: {
    ...initialResourceMetaState,
    title: 'Timeline',
    resources: [],
    isLoadingList: false,
    isLoadingRemote: false,
    isImporting: false,
    isExporting: false,
    isSaving: false,
    error: null,
  },
};

export const analysisStoreReducer = createReducer(
  initialAnalysisStoreState,
  on(analysisStoreSetCurrentPanel, (state, { panel }) => ({
    ...state,
    panel: {
      ...state.panel,
      currentContent: panel,
      title: panel.panelName?.trim() || state.panel.title,
    },
  })),
  on(analysisStoreHydratePanelFromValidatedPayload, (state, { panel, context }) => ({
    ...state,
    panel: {
      ...state.panel,
      currentResourceId: context?.resourceId ?? null,
      title: context?.title ?? panel.panelName ?? 'My Panel',
      description: context?.description ?? null,
      visibility: context?.visibility ?? 'private',
      clubId: context?.clubId ?? null,
      hasAnonymizedContent: context?.hasAnonymizedContent ?? false,
      currentContent: panel,
      error: null,
    },
  })),
  on(analysisStoreHydrateTimelineResourceMeta, (state, { timeline, context }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      currentResourceId: context?.resourceId ?? null,
      title: context?.title ?? timeline.timelineName ?? 'Timeline',
      description: context?.description ?? null,
      visibility: context?.visibility ?? 'private',
      clubId: context?.clubId ?? null,
      hasAnonymizedContent: context?.hasAnonymizedContent ?? false,
      error: null,
    },
  })),
  on(analysisStoreSavePanel, state => ({
    ...state,
    panel: {
      ...state.panel,
      isSaving: true,
      error: null,
    },
  })),
  on(analysisStoreSavePanelSuccess, (state, { resource }) => ({
    ...state,
    panel: {
      ...state.panel,
      ...toResourceMetaState(resource),
      title: resource.title,
      isSaving: false,
      error: null,
    },
  })),
  on(analysisStoreSavePanelFailure, (state, { error }) => ({
    ...state,
    panel: {
      ...state.panel,
      isSaving: false,
      error,
    },
  })),
  on(analysisStoreSaveTimeline, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isSaving: true,
      error: null,
    },
  })),
  on(analysisStoreSaveTimelineSuccess, (state, { resource }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      ...toResourceMetaState(resource),
      title: resource.title,
      isSaving: false,
      error: null,
    },
  })),
  on(analysisStoreSaveTimelineFailure, (state, { error }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      isSaving: false,
      error,
    },
  })),
  on(analysisStoreImportTimeline, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isImporting: true,
      error: null,
    },
  })),
  on(analysisStoreImportTimelineSuccess, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isImporting: false,
      error: null,
    },
  })),
  on(analysisStoreImportTimelineFailure, (state, { error }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      isImporting: false,
      error,
    },
  })),
  on(analysisStoreExportTimeline, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isExporting: true,
      error: null,
    },
  })),
  on(analysisStoreExportTimelineSuccess, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isExporting: false,
      error: null,
    },
  })),
  on(analysisStoreExportTimelineFailure, (state, { error }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      isExporting: false,
      error,
    },
  })),
  on(analysisStoreLoadTimelineList, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isLoadingList: true,
      error: null,
    },
  })),
  on(analysisStoreLoadTimelineListSuccess, (state, { resources }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      resources,
      isLoadingList: false,
      error: null,
    },
  })),
  on(analysisStoreLoadTimelineListFailure, (state, { error }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      isLoadingList: false,
      error,
    },
  })),
  on(analysisStoreLoadRemoteTimeline, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isLoadingRemote: true,
      error: null,
    },
  })),
  on(analysisStoreLoadRemoteTimelineSuccess, state => ({
    ...state,
    timeline: {
      ...state.timeline,
      isLoadingRemote: false,
      error: null,
    },
  })),
  on(analysisStoreLoadRemoteTimelineFailure, (state, { error }) => ({
    ...state,
    timeline: {
      ...state.timeline,
      isLoadingRemote: false,
      error,
    },
  })),
);

function toResourceMetaState(resource: TimelineResourceResponse | PanelResourceResponse): AnalysisStoreResourceMetaState {
  return {
    currentResourceId: resource.id,
    title: resource.title,
    description: resource.description,
    visibility: resource.visibility,
    clubId: resource.clubId,
    hasAnonymizedContent: resource.hasAnonymizedContent,
    lastSavedAt: resource.updatedAt,
  };
}
