import { createSelector } from '@ngrx/store';
import { DataState } from './dataState.reducers';
import {AppState} from '../initial-state.state';

export const selectDataState = (state: AppState) => state.dataState;

export const selectDisplayedData = createSelector(
  selectDataState,
  (state: DataState) => state.displayed
);
