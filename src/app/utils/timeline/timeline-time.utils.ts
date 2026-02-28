import { TIMELINE_MIN_DURATION_MS, TIMELINE_SNAP_STEP_MS } from '../../interfaces/timeline/timeline-defaults.constants';
import { TimelineOccurrence, TimelineShiftScope } from '../../interfaces/timeline/timeline.interface';

export interface PlaybackInterval {
  startMs: number;
  endMs: number;
}

export const clampMs = (value: number, min = 0, max = Number.POSITIVE_INFINITY): number =>
  Math.max(min, Math.min(max, value));

export const snapMs = (value: number, stepMs = TIMELINE_SNAP_STEP_MS): number =>
  Math.round(value / stepMs) * stepMs;

export const ensureMinDuration = (startMs: number, endMs: number, minDurationMs = TIMELINE_MIN_DURATION_MS) => {
  if (endMs - startMs >= minDurationMs) {
    return { startMs, endMs };
  }
  return { startMs, endMs: startMs + minDurationMs };
};

export const normalizeTiming = (
  startMs: number,
  endMs: number,
  snapStepMs = TIMELINE_SNAP_STEP_MS,
  minDurationMs = TIMELINE_MIN_DURATION_MS,
) => {
  const snappedStart = clampMs(snapMs(startMs, snapStepMs));
  const snappedEnd = clampMs(snapMs(Math.max(endMs, snappedStart), snapStepMs));
  return ensureMinDuration(snappedStart, snappedEnd, minDurationMs);
};

export const shiftOccurrences = (
  occurrences: TimelineOccurrence[],
  deltaMs: number,
  scope: TimelineShiftScope,
  selectedIds: string[],
): TimelineOccurrence[] => {
  const selected = new Set(selectedIds);
  return occurrences.map(occurrence => {
    const shouldShift = scope === 'ALL' || selected.has(occurrence.id);
    if (!shouldShift) {
      return occurrence;
    }
    const duration = occurrence.endMs - occurrence.startMs;
    const nextStart = clampMs(occurrence.startMs + deltaMs, 0);
    return {
      ...occurrence,
      startMs: nextStart,
      endMs: nextStart + duration,
      updatedAtIso: new Date().toISOString(),
    };
  });
};

export const mergeIntervalsForPlayback = (intervals: PlaybackInterval[]): PlaybackInterval[] => {
  const sorted = [...intervals]
    .filter(interval => interval.endMs > interval.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  const merged: PlaybackInterval[] = [];
  sorted.forEach(interval => {
    const previous = merged[merged.length - 1];
    if (!previous || interval.startMs > previous.endMs) {
      merged.push({ ...interval });
      return;
    }
    previous.endMs = Math.max(previous.endMs, interval.endMs);
  });

  return merged;
};
