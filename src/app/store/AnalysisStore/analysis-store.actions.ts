import { createAction, props } from '@ngrx/store';
import {
  AnalysisStoreVisibility,
  AnalysisTimelineV1,
  AnalysisStoreImportValidationPayload,
  PanelResourceResponse,
  SequencerPanelV1,
  TimelineResourceResponse,
} from '../../interfaces/analysis-store';
import { SequencerPanel } from '../../interfaces/sequencer-panel.interface';

export interface SaveAnalysisStorePanelPayload {
  id?: string;
  title?: string;
  description?: string | null;
  visibility?: AnalysisStoreVisibility;
  clubId?: string | null;
  hasAnonymizedContent?: boolean;
}

export interface SaveAnalysisStoreTimelinePayload {
  id?: string;
  title?: string;
  description?: string | null;
  hasAnonymizedContent?: boolean;
}

export interface AnalysisStoreLoadResourceContext {
  resourceId?: string | null;
  title?: string;
  description?: string | null;
  visibility?: AnalysisStoreVisibility;
  clubId?: string | null;
  hasAnonymizedContent?: boolean;
}

export const analysisStoreSetCurrentPanel = createAction(
  '[Analysis Store] Set Current Panel',
  props<{ panel: SequencerPanel }>(),
);

export const analysisStoreResetPanelState = createAction('[Analysis Store] Reset Panel State');
export const analysisStoreResetWorkspaceState = createAction('[Analysis Store] Reset Workspace State');

export const analysisStoreLoadPanelFromValidatedPayload = createAction(
  '[Analysis Store] Load Panel From Validated Payload',
  props<{ payload: SequencerPanelV1; context?: AnalysisStoreLoadResourceContext }>(),
);

export const analysisStoreHydratePanelFromValidatedPayload = createAction(
  '[Analysis Store] Hydrate Panel From Validated Payload',
  props<{ panel: SequencerPanel; context?: AnalysisStoreLoadResourceContext }>(),
);

export const analysisStoreLoadTimelineFromValidatedPayload = createAction(
  '[Analysis Store] Load Timeline From Validated Payload',
  props<{ payload: AnalysisTimelineV1; context?: AnalysisStoreLoadResourceContext }>(),
);

export const analysisStoreHydrateTimelineResourceMeta = createAction(
  '[Analysis Store] Hydrate Timeline Resource Meta',
  props<{ timeline: AnalysisTimelineV1; context?: AnalysisStoreLoadResourceContext }>(),
);

export const analysisStoreSavePanel = createAction(
  '[Analysis Store] Save Panel',
  props<{ payload?: SaveAnalysisStorePanelPayload }>(),
);
export const analysisStoreSavePanelSuccess = createAction(
  '[Analysis Store] Save Panel Success',
  props<{ resource: PanelResourceResponse }>(),
);
export const analysisStoreSavePanelFailure = createAction(
  '[Analysis Store] Save Panel Failure',
  props<{ error: string }>(),
);

export const analysisStoreImportPanel = createAction(
  '[Analysis Store] Import Panel',
  props<{ payload: AnalysisStoreImportValidationPayload; context?: AnalysisStoreLoadResourceContext }>(),
);
export const analysisStoreImportPanelSuccess = createAction('[Analysis Store] Import Panel Success');
export const analysisStoreImportPanelFailure = createAction(
  '[Analysis Store] Import Panel Failure',
  props<{ error: string }>(),
);

export const analysisStoreExportPanel = createAction('[Analysis Store] Export Panel');
export const analysisStoreExportPanelSuccess = createAction('[Analysis Store] Export Panel Success');
export const analysisStoreExportPanelFailure = createAction(
  '[Analysis Store] Export Panel Failure',
  props<{ error: string }>(),
);

export const analysisStoreLoadPanelList = createAction('[Analysis Store] Load Panel List');
export const analysisStoreLoadPanelListSuccess = createAction(
  '[Analysis Store] Load Panel List Success',
  props<{ resources: PanelResourceResponse[] }>(),
);
export const analysisStoreLoadPanelListFailure = createAction(
  '[Analysis Store] Load Panel List Failure',
  props<{ error: string }>(),
);

export const analysisStoreLoadRemotePanel = createAction(
  '[Analysis Store] Load Remote Panel',
  props<{ resource: PanelResourceResponse }>(),
);
export const analysisStoreLoadRemotePanelSuccess = createAction('[Analysis Store] Load Remote Panel Success');
export const analysisStoreLoadRemotePanelFailure = createAction(
  '[Analysis Store] Load Remote Panel Failure',
  props<{ error: string }>(),
);

export const analysisStoreCopyRemotePanel = createAction(
  '[Analysis Store] Copy Remote Panel',
  props<{ sourceResource: PanelResourceResponse }>(),
);
export const analysisStoreCopyRemotePanelSuccess = createAction('[Analysis Store] Copy Remote Panel Success');
export const analysisStoreCopyRemotePanelFailure = createAction(
  '[Analysis Store] Copy Remote Panel Failure',
  props<{ error: string }>(),
);

export const analysisStoreSaveTimeline = createAction(
  '[Analysis Store] Save Timeline',
  props<{ payload?: SaveAnalysisStoreTimelinePayload }>(),
);
export const analysisStoreSaveTimelineSuccess = createAction(
  '[Analysis Store] Save Timeline Success',
  props<{ resource: TimelineResourceResponse }>(),
);
export const analysisStoreSaveTimelineFailure = createAction(
  '[Analysis Store] Save Timeline Failure',
  props<{ error: string }>(),
);

export const analysisStoreImportTimeline = createAction(
  '[Analysis Store] Import Timeline',
  props<{ payload: AnalysisStoreImportValidationPayload; context?: AnalysisStoreLoadResourceContext }>(),
);
export const analysisStoreImportTimelineSuccess = createAction('[Analysis Store] Import Timeline Success');
export const analysisStoreImportTimelineFailure = createAction(
  '[Analysis Store] Import Timeline Failure',
  props<{ error: string }>(),
);

export const analysisStoreExportTimeline = createAction('[Analysis Store] Export Timeline');
export const analysisStoreExportTimelineSuccess = createAction('[Analysis Store] Export Timeline Success');
export const analysisStoreExportTimelineFailure = createAction(
  '[Analysis Store] Export Timeline Failure',
  props<{ error: string }>(),
);

export const analysisStoreLoadTimelineList = createAction('[Analysis Store] Load Timeline List');
export const analysisStoreLoadTimelineListSuccess = createAction(
  '[Analysis Store] Load Timeline List Success',
  props<{ resources: TimelineResourceResponse[] }>(),
);
export const analysisStoreLoadTimelineListFailure = createAction(
  '[Analysis Store] Load Timeline List Failure',
  props<{ error: string }>(),
);

export const analysisStoreLoadRemoteTimeline = createAction(
  '[Analysis Store] Load Remote Timeline',
  props<{ resource: TimelineResourceResponse }>(),
);
export const analysisStoreLoadRemoteTimelineSuccess = createAction('[Analysis Store] Load Remote Timeline Success');
export const analysisStoreLoadRemoteTimelineFailure = createAction(
  '[Analysis Store] Load Remote Timeline Failure',
  props<{ error: string }>(),
);
