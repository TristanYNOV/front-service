export type TimelineTimingMode = 'once' | 'indefinite';
export type TimelineLabelBehavior = 'once' | 'indefinite';

export interface TimelineMetadata {
  timelineName: string;
  analysisName: string;
  createdAtIso: string;
  updatedAtIso: string;
  userId: string;
  team?: string;
  players?: string[];
}

export interface TimelineEventDef {
  id: string;
  sourceSequencerBtnId: string;
  name: string;
  colorHex?: string;
  timingMode: TimelineTimingMode;
  preMs: number;
  postMs: number;
}

export interface TimelineLabelDef {
  id: string;
  sourceSequencerBtnId: string;
  name: string;
  behavior: TimelineLabelBehavior;
}

export interface TimelineDefinitions {
  eventDefs: TimelineEventDef[];
  labelDefs: TimelineLabelDef[];
}

export interface TimelineOccurrence {
  id: string;
  eventDefId: string;
  startMs: number;
  endMs: number;
  labelIds: string[];
  createdAtIso: string;
  updatedAtIso: string;
  isOpen?: boolean;
}

export interface TimelineUiState {
  scrollX: number;
  scrollY: number;
  selectedOccurrenceIds: string[];
  autoFollow: boolean;
}

export interface TimelineDocument {
  schemaVersion: string;
  meta: TimelineMetadata;
  definitions: TimelineDefinitions;
  occurrences: TimelineOccurrence[];
  ui: TimelineUiState;
}

export type TimelineShiftScope = 'ALL' | 'SELECTION';
