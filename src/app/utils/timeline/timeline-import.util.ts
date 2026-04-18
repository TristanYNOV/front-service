import { AnalysisTimelineV1 } from '../../interfaces/analysis-store';
import { TimelineState } from '../../store/Timeline/timeline.reducer';

export function hasTimelineImportDataLoss(currentTimeline: TimelineState, nextTimeline: AnalysisTimelineV1): boolean {
  const hasCurrentData =
    currentTimeline.definitions.eventDefs.length > 0 ||
    currentTimeline.definitions.labelDefs.length > 0 ||
    currentTimeline.occurrences.length > 0;

  if (!hasCurrentData) {
    return false;
  }

  const nextEventIds = new Set(nextTimeline.eventDefs.map(definition => definition.id));
  const nextLabelIds = new Set(nextTimeline.labelDefs.map(definition => definition.id));
  const nextOccurrenceIds = new Set(nextTimeline.occurrences.map(occurrence => occurrence.id));

  const eventLoss = currentTimeline.definitions.eventDefs.some(definition => !nextEventIds.has(definition.id));
  const labelLoss = currentTimeline.definitions.labelDefs.some(definition => !nextLabelIds.has(definition.id));
  const occurrenceLoss = currentTimeline.occurrences.some(occurrence => !nextOccurrenceIds.has(occurrence.id));

  return eventLoss || labelLoss || occurrenceLoss;
}

export function hasTimelineImportDataLossFromRawPayload(
  currentTimeline: TimelineState,
  rawPayload: Record<string, unknown>,
): boolean {
  const eventDefs = Array.isArray(rawPayload['eventDefs']) ? rawPayload['eventDefs'] : [];
  const labelDefs = Array.isArray(rawPayload['labelDefs']) ? rawPayload['labelDefs'] : [];
  const occurrences = Array.isArray(rawPayload['occurrences']) ? rawPayload['occurrences'] : [];

  const normalizedNext: AnalysisTimelineV1 = {
    schemaVersion: '1.0.0',
    type: 'analysis-timeline',
    timelineName: typeof rawPayload['timelineName'] === 'string' ? rawPayload['timelineName'] : 'Timeline',
    meta: {
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
      exportedAtIso: new Date().toISOString(),
      sourceUserId: null,
      sourceApp: 'front-service',
      sourceAppVersion: 'unknown',
    },
    eventDefs: eventDefs
      .map(item => (typeof item === 'object' && item ? item : null))
      .filter((item): item is { id: string; name?: string; colorHex?: string | null } => !!item && typeof item.id === 'string')
      .map(item => ({ id: item.id, name: item.name ?? item.id, colorHex: item.colorHex ?? null })),
    labelDefs: labelDefs
      .map(item => (typeof item === 'object' && item ? item : null))
      .filter((item): item is { id: string; name?: string; colorHex?: string | null } => !!item && typeof item.id === 'string')
      .map(item => ({ id: item.id, name: item.name ?? item.id, colorHex: item.colorHex ?? null })),
    occurrences: occurrences
      .map(item => (typeof item === 'object' && item ? item : null))
      .filter(
        (item): item is { id: string; eventDefId?: string | null; labelDefId?: string | null; occurredAtIso?: string; durationMs?: number; note?: string | null } =>
          !!item && typeof item.id === 'string',
      )
      .map(item => ({
        id: item.id,
        eventDefId: item.eventDefId ?? null,
        labelDefId: item.labelDefId ?? null,
        occurredAtIso: item.occurredAtIso ?? new Date().toISOString(),
        durationMs: typeof item.durationMs === 'number' ? item.durationMs : 0,
        note: item.note ?? null,
      })),
    ui: { zoom: 1, showLabels: true, selectedOccurrenceId: null },
  };

  return hasTimelineImportDataLoss(currentTimeline, normalizedNext);
}
