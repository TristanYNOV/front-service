import {
  AnalysisStoreMetaV1,
  AnalysisStoreResourceResponse,
  AnalysisStoreSchemaVersion,
  AnalysisStoreValidationResponse,
  AnalysisStoreVisibility,
} from './analysis-store-shared.interface';

export interface SequencerPanelLayoutV1 {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export interface SequencerPanelBtnBaseV1 {
  id: string;
  name: string;
  isAnonymized?: boolean;
  layout: SequencerPanelLayoutV1;
  hotkeyNormalized: string | null;
  deactivateIds: string[];
  activateIds: string[];
}

export interface SequencerPanelEventBtnV1 extends SequencerPanelBtnBaseV1 {
  type: 'event';
  eventProps: {
    eventName: string;
    colorHex: string | null;
  };
}

export interface SequencerPanelLabelBtnV1 extends SequencerPanelBtnBaseV1 {
  type: 'label';
  labelProps: {
    label: string;
    colorHex: string | null;
  };
}

export interface SequencerPanelStatBtnV1 extends SequencerPanelBtnBaseV1 {
  type: 'stat';
  stat: {
    statName: string;
    value: number;
    colorHex: string | null;
  };
}

export type SequencerPanelBtnV1 = SequencerPanelEventBtnV1 | SequencerPanelLabelBtnV1 | SequencerPanelStatBtnV1;

export interface SequencerPanelV1 {
  schemaVersion: AnalysisStoreSchemaVersion;
  type: 'sequencer-panel';
  panelName: string;
  meta: AnalysisStoreMetaV1;
  btnList: SequencerPanelBtnV1[];
}

export interface PanelImportValidationSummary {
  panelName: string;
  buttonCount: number;
  eventButtonCount: number;
  labelButtonCount: number;
  statButtonCount: number;
}

export type PanelImportValidationResponse = AnalysisStoreValidationResponse<
  'sequencer-panel',
  PanelImportValidationSummary,
  SequencerPanelV1
>;

export type PanelResourceResponse = AnalysisStoreResourceResponse;

export interface CreatePanelResourceBody {
  title: string;
  description?: string | null;
  contentJson: Record<string, unknown>;
  visibility?: AnalysisStoreVisibility;
  clubId?: string | null;
  hasAnonymizedContent?: boolean;
}

export interface UpdatePanelResourceBody {
  title?: string;
  description?: string | null;
  contentJson: Record<string, unknown>;
  visibility?: AnalysisStoreVisibility;
  clubId?: string | null;
  hasAnonymizedContent?: boolean;
}

export type UpsertPanelResourceBody = (CreatePanelResourceBody | UpdatePanelResourceBody) & { id?: string };
