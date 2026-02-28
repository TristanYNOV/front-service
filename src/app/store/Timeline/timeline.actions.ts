import { createAction, props } from '@ngrx/store';
import {
  TimelineDefinitions,
  TimelineMetadata,
  TimelineOccurrence,
  TimelineShiftScope,
} from '../../interfaces/timeline/timeline.interface';

export const initTimeline = createAction(
  '[Timeline] Init Timeline',
  props<{ schemaVersion: string; meta: TimelineMetadata; definitions: TimelineDefinitions; occurrences: TimelineOccurrence[] }>(),
);

export const upsertDefinitions = createAction(
  '[Timeline] Upsert Definitions',
  props<{ definitions: TimelineDefinitions }>(),
);

export const addOccurrence = createAction('[Timeline] Add Occurrence', props<{ occurrence: TimelineOccurrence }>());

export const updateOccurrenceTiming = createAction(
  '[Timeline] Update Occurrence Timing',
  props<{ id: string; startMs: number; endMs: number; isOpen?: boolean }>(),
);

export const removeOccurrence = createAction('[Timeline] Remove Occurrence', props<{ id: string }>());

export const setSelection = createAction('[Timeline] Set Selection', props<{ ids: string[] }>());

export const setUiScroll = createAction('[Timeline] Set Ui Scroll', props<{ scrollX: number; scrollY: number }>());

export const addLabelToSelection = createAction('[Timeline] Add Label To Selection', props<{ labelId: string }>());

export const removeLabelFromSelection = createAction('[Timeline] Remove Label From Selection', props<{ labelId: string }>());

export const shiftTimeline = createAction('[Timeline] Shift', props<{ deltaMs: number; scope: TimelineShiftScope }>());

export const alignToCurrentTimebase = createAction(
  '[Timeline] Align To Current Timebase',
  props<{ referenceOccurrenceId: string; currentTimeMs: number }>(),
);

export const undoLastShiftOrAlign = createAction('[Timeline] Undo Last ShiftOrAlign (1 niveau)');

export const setAutoFollow = createAction('[Timeline] Set Auto Follow', props<{ enabled: boolean }>());
