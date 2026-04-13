import { AnalysisTimelineV1 } from '../../../interfaces/analysis-store';
import { TIMELINE_DEFAULT_POST_MS, TIMELINE_DEFAULT_PRE_MS } from '../../../interfaces/timeline/timeline-defaults.constants';
import { TimelineDocument, TimelineMetadata, TimelineOccurrence } from '../../../interfaces/timeline/timeline.interface';
import { TimelineState } from '../../../store/Timeline/timeline.reducer';

const ANALYSIS_STORE_SCHEMA_VERSION = '1.0.0' as const;
const SOURCE_APP = 'front-service';
const SOURCE_APP_VERSION = 'unknown';

export function mapTimelineStateToAnalysisTimelineV1(timelineState: TimelineState): AnalysisTimelineV1 {
  const nowIso = new Date().toISOString();

  return {
    schemaVersion: ANALYSIS_STORE_SCHEMA_VERSION,
    type: 'analysis-timeline',
    timelineName: timelineState.meta.timelineName?.trim() || 'Timeline',
    meta: {
      createdAtIso: timelineState.meta.createdAtIso,
      updatedAtIso: timelineState.meta.updatedAtIso,
      exportedAtIso: nowIso,
      sourceUserId: timelineState.meta.userId ?? null,
      sourceApp: timelineState.meta.analysisName || SOURCE_APP,
      sourceAppVersion: SOURCE_APP_VERSION,
    },
    eventDefs: timelineState.definitions.eventDefs.map(definition => ({
      id: definition.id,
      name: definition.name,
      colorHex: definition.colorHex ?? null,
    })),
    labelDefs: timelineState.definitions.labelDefs.map(definition => ({
      id: definition.id,
      name: definition.name,
      colorHex: null,
    })),
    occurrences: timelineState.occurrences.map(occurrence => mapOccurrenceToV1(occurrence)),
    ui: {
      zoom: 1,
      showLabels: true,
      selectedOccurrenceId: timelineState.ui.selectedOccurrenceIds[0] ?? null,
    },
  };
}

export function mapAnalysisTimelineV1ToTimelineDocument(payload: AnalysisTimelineV1): TimelineDocument {
  const fallbackNow = new Date().toISOString();
  const metadata: TimelineMetadata = {
    timelineName: payload.timelineName?.trim() || 'Timeline',
    analysisName: payload.meta.sourceApp || 'Analyse locale',
    createdAtIso: payload.meta.createdAtIso || fallbackNow,
    updatedAtIso: payload.meta.updatedAtIso || fallbackNow,
    userId: payload.meta.sourceUserId || 'local-user',
  };

  return {
    schemaVersion: payload.schemaVersion,
    meta: metadata,
    definitions: {
      eventDefs: payload.eventDefs.map(definition => ({
        id: definition.id,
        sourceSequencerBtnId: definition.id,
        name: definition.name,
        colorHex: definition.colorHex ?? undefined,
        timingMode: 'once',
        preMs: TIMELINE_DEFAULT_PRE_MS,
        postMs: TIMELINE_DEFAULT_POST_MS,
      })),
      labelDefs: payload.labelDefs.map(definition => ({
        id: definition.id,
        sourceSequencerBtnId: definition.id,
        name: definition.name,
        behavior: 'once',
      })),
    },
    occurrences: payload.occurrences.map(occurrence => {
      const startMs = parseMsFromIso(occurrence.occurredAtIso);
      const durationMs = Math.max(0, occurrence.durationMs || 0);

      return {
        id: occurrence.id,
        eventDefId: occurrence.eventDefId || 'unknown-event',
        startMs,
        endMs: startMs + durationMs,
        labelIds: occurrence.labelDefId ? [occurrence.labelDefId] : [],
        createdAtIso: occurrence.occurredAtIso,
        updatedAtIso: occurrence.occurredAtIso,
      };
    }),
    ui: {
      scrollX: 0,
      scrollY: 0,
      autoFollow: true,
      selectedOccurrenceIds: payload.ui.selectedOccurrenceId ? [payload.ui.selectedOccurrenceId] : [],
    },
  };
}

function mapOccurrenceToV1(occurrence: TimelineOccurrence) {
  return {
    id: occurrence.id,
    eventDefId: occurrence.eventDefId,
    labelDefId: occurrence.labelIds[0] ?? null,
    occurredAtIso: new Date(occurrence.startMs).toISOString(),
    durationMs: Math.max(0, occurrence.endMs - occurrence.startMs),
    note: null,
  };
}

function parseMsFromIso(iso: string): number {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}
