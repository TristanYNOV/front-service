export type AnalysisStoreSchemaVersion = '1.0.0';
export type AnalysisStoreDocumentType = 'analysis-timeline' | 'sequencer-panel';
export type AnalysisStoreVisibility = 'private' | 'club' | 'public';

export interface AnalysisStoreMetaV1 {
  createdAtIso: string;
  updatedAtIso: string;
  exportedAtIso: string;
  sourceUserId: string | null;
  sourceApp: string;
  sourceAppVersion: string;
}

export interface AnalysisStoreValidationError {
  code: string;
  path: string;
  message: string;
}

export interface AnalysisStoreValidationResponse<TType extends AnalysisStoreDocumentType, TSummary, TNormalizedPayload> {
  type: TType;
  schemaVersion: AnalysisStoreSchemaVersion;
  valid: boolean;
  detectedType: AnalysisStoreDocumentType | null;
  summary: TSummary;
  normalizedPayload: TNormalizedPayload | null;
  errors: AnalysisStoreValidationError[];
}

export interface AnalysisStoreResourceResponse {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  visibility: AnalysisStoreVisibility;
  clubId: string | null;
  contentJson: Record<string, unknown>;
  hasAnonymizedContent: boolean;
  createdAt: string;
  updatedAt: string;
}
