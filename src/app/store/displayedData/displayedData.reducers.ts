import { createReducer, on } from '@ngrx/store';
import {DisplayedData} from '../../interfaces/displayedData.interface';
import {clearDisplayedData, loadDisplayedData} from './displayedData.actions';

export interface DisplayedDataState {
  data: DisplayedData[];
}

// define the maximum elements to display on the screen
const dataLimitToDisplay = 4;

const initialState: DisplayedDataState = {
  data: [],
};

export const displayedDataReducer = createReducer(
  initialState,
  // TODO: Add checks if there is already 4 elements on initial state
  on(loadDisplayedData, (state, { data }) => ({
    ...state,
    data,
  })),
  on(clearDisplayedData, (state) => ({
    ...state,
    data: [],
  }))
);
