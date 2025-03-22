import { createSelector } from '@ngrx/store';
import {AppState} from '../initial-state.state';

export const selectSavedData = (state: AppState) => state.savedData;

export const selectAllSavedData = createSelector(
  selectSavedData,
  (state) => state.savedItems
);
