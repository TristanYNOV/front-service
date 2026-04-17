import { createReducer, on } from '@ngrx/store';
import { AnalysisStoreVisibility, PanelResourceResponse, TimelineResourceResponse } from '../../interfaces/analysis-store';
import { SequencerPanel } from '../../interfaces/sequencer-panel.interface';
import {
  analysisStoreCopyRemotePanel,
  analysisStoreCopyRemotePanelFailure,
  analysisStoreCopyRemotePanelSuccess,
  analysisStoreExportPanel,
  analysisStoreExportPanelFailure,
  analysisStoreExportPanelSuccess,
  analysisStoreExportTimeline,
  analysisStoreExportTimelineFailure,
  analysisStoreExportTimelineSuccess,
  analysisStoreHydratePanelFromValidatedPayload,
  analysisStoreImportPanel,
  analysisStoreImportPanelFailure,
  analysisStoreImportPanelSuccess,
  analysisStoreHydrateTimelineResourceMeta,
  analysisStoreLoadPanelList,
  analysisStoreLoadPanelListFailure,
  analysisStoreLoadPanelListSuccess,
  analysisStoreLoadRemotePanel,
  analysisStoreLoadRemotePanelFailure,
  analysisStoreLoadRemotePanelSuccess,
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
    resources: PanelResourceResponse[];
    isLoadingList: boolean;
    isLoadingRemote: boolean;
    isImporting: boolean;
    isExporting: boolean;
    isCopying: boolean;
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
    resources: [],
    isLoadingList: false,
    isLoadingRemote: false,
    isImporting: false,
    isExporting: false,
    isCopying: false,
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
  on(analysisStoreImportPanel, state => ({
    ...state,
    panel: {
      ...state.panel,
      isImporting: true,
      error: null,
    },
  })),
  on(analysisStoreImportPanelSuccess, state => ({
    ...state,
    panel: {
      ...state.panel,
      isImporting: false,
      error: null,
    },
  })),
  on(analysisStoreImportPanelFailure, (state, { error }) => ({
    ...state,
    panel: {
      ...state.panel,
      isImporting: false,
      error,
    },
  })),
  on(analysisStoreExportPanel, state => ({
    ...state,
    panel: {
      ...state.panel,
      isExporting: true,
      error: null,
    },
  })),
  on(analysisStoreExportPanelSuccess, state => ({
    ...state,
    panel: {
      ...state.panel,
      isExporting: false,
      error: null,
    },
  })),
  on(analysisStoreExportPanelFailure, (state, { error }) => ({
    ...state,
    panel: {
      ...state.panel,
      isExporting: false,
      error,
    },
  })),
  on(analysisStoreLoadPanelList, state => ({
    ...state,
    panel: {
      ...state.panel,
      isLoadingList: true,
      error: null,
    },
  })),
  on(analysisStoreLoadPanelListSuccess, (state, { resources }) => ({
    ...state,
    panel: {
      ...state.panel,
      resources,
      isLoadingList: false,
      error: null,
    },
  })),
  on(analysisStoreLoadPanelListFailure, (state, { error }) => ({
    ...state,
    panel: {
      ...state.panel,
      isLoadingList: false,
      error,
    },
  })),
  on(analysisStoreLoadRemotePanel, state => ({
    ...state,
    panel: {
      ...state.panel,
      isLoadingRemote: true,
      error: null,
    },
  })),
  on(analysisStoreLoadRemotePanelSuccess, state => ({
    ...state,
    panel: {
      ...state.panel,
      isLoadingRemote: false,
      error: null,
    },
  })),
  on(analysisStoreLoadRemotePanelFailure, (state, { error }) => ({
    ...state,
    panel: {
      ...state.panel,
      isLoadingRemote: false,
      error,
    },
  })),
  on(analysisStoreCopyRemotePanel, state => ({
    ...state,
    panel: {
      ...state.panel,
      isCopying: true,
      error: null,
    },
  })),
  on(analysisStoreCopyRemotePanelSuccess, state => ({
    ...state,
    panel: {
      ...state.panel,
      isCopying: false,
      error: null,
    },
  })),
  on(analysisStoreCopyRemotePanelFailure, (state, { error }) => ({
    ...state,
    panel: {
      ...state.panel,
      isCopying: false,
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
