import { createAction, props } from '@ngrx/store';
import {
  AnalysisStoreVisibility,
  AnalysisTimelineV1,
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
