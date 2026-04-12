import {
  AnalysisStoreMetaV1,
  AnalysisStoreResourceResponse,
  AnalysisStoreSchemaVersion,
  AnalysisStoreValidationResponse,
} from './analysis-store-shared.interface';

export interface AnalysisTimelineEventDefV1 {
  id: string;
  name: string;
  colorHex: string | null;
}

export interface AnalysisTimelineLabelDefV1 {
  id: string;
  name: string;
  colorHex: string | null;
}

export interface AnalysisTimelineOccurrenceV1 {
  id: string;
  eventDefId: string | null;
  labelDefId: string | null;
  occurredAtIso: string;
  durationMs: number;
  note: string | null;
}

export interface AnalysisTimelineUiV1 {
  zoom: number;
  showLabels: boolean;
  selectedOccurrenceId: string | null;
}

export interface AnalysisTimelineV1 {
  schemaVersion: AnalysisStoreSchemaVersion;
  type: 'analysis-timeline';
  timelineName: string;
  meta: AnalysisStoreMetaV1;
  eventDefs: AnalysisTimelineEventDefV1[];
  labelDefs: AnalysisTimelineLabelDefV1[];
  occurrences: AnalysisTimelineOccurrenceV1[];
  ui: AnalysisTimelineUiV1;
}

export interface TimelineImportValidationSummary {
  timelineName: string;
  eventDefCount: number;
  labelDefCount: number;
  occurrenceCount: number;
}

export type TimelineImportValidationResponse = AnalysisStoreValidationResponse<
  'analysis-timeline',
  TimelineImportValidationSummary,
  AnalysisTimelineV1
>;

export type TimelineResourceResponse = AnalysisStoreResourceResponse;

export interface CreateTimelineResourceBody {
  title: string;
  description?: string | null;
  contentJson: Record<string, unknown>;
  hasAnonymizedContent?: boolean;
}

export interface UpdateTimelineResourceBody {
  title?: string;
  description?: string | null;
  contentJson: Record<string, unknown>;
  hasAnonymizedContent?: boolean;
}

export type UpsertTimelineResourceBody = (CreateTimelineResourceBody | UpdateTimelineResourceBody) & { id?: string };
