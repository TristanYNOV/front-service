import { createAction, props } from '@ngrx/store';
import { AnyDataItems } from '../../interfaces/dataItem.interface';

// IDLE ACTIONS
export const addToIdle = createAction(
  '[DataState] Add to idle',
  props<{ item: AnyDataItems }>()
);
export const removeFromIdle = createAction(
  '[DataState] Remove from idle',
  props<{ id: string }>()
);
export const displayFromIdle = createAction(
  '[DataState] Display from idle',
  props<{ id: string }>()
);
export const saveFromIdle = createAction(
  '[DataState] Saved from idle',
  props<{ id: string }>()
);

// DISPLAY ACTIONS
export const removeFromDisplay = createAction(
  '[DataState] Remove from display',
  props<{ id: string }>()
);

export const saveFromDisplay = createAction(
  '[DataState] Saved from display',
  props<{ id: string }>()
);

// SAVED ACTIONS
export const displayFromSaved = createAction(
  '[DataState] Display from saved',
  props<{ id: string }>()
);



