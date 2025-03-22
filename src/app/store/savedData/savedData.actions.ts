import { createAction, props } from '@ngrx/store';
import {DisplayedData} from '../../interfaces/displayedData.interface';

// Actions pour gérer les données sauvegardées
export const saveData = createAction(
  '[SavedData] Save Data',
  props<{ data: DisplayedData }>()
);

export const removeSavedData = createAction(
  '[SavedData] Remove Data',
  props<{ id: string }>()
);
