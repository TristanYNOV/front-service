import { AnalysisTimelineV1, TimelineImportValidationResponse } from './analysis-store-timeline.interface';
import { PanelImportValidationResponse, SequencerPanelV1 } from './analysis-store-panel.interface';

export type AnalysisStoreImportValidationPayload = AnalysisTimelineV1 | SequencerPanelV1 | Record<string, unknown>;

export type AnalysisStoreValidationAnyResponse = TimelineImportValidationResponse | PanelImportValidationResponse;
