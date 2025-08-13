import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DataState } from './dataState.reducers';

// Sélecteur de la feature entière
export const selectDataState = createFeatureSelector<DataState>('dataState');

// Sélecteur des éléments idle
export const selectIdleItems = createSelector(
  selectDataState,
  (state) => state.idle
);

// Sélecteur des éléments saved
export const selectSavedItems = createSelector(
  selectDataState,
  (state) => state.saved
);

// Tu peux aussi rajouter pour displayed si besoin
export const selectDisplayedItems = createSelector(
  selectDataState,
  (state) => state.displayed
);
