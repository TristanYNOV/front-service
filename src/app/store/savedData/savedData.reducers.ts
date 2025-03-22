import { createReducer, on } from '@ngrx/store';
import {removeSavedData, saveData} from './savedData.actions';
import { DisplayedData } from '../../interfaces/displayedData.interface';

export interface SavedDataState {
  savedItems: DisplayedData[];
}

const initialState: SavedDataState = {
  savedItems: [],
};

export const savedDataReducer = createReducer(
  initialState,
  on(saveData, (state, { data }) => ({
    ...state,
    savedItems: [...state.savedItems, data],
  })),
  on(removeSavedData, (state, { id }) => ({
    ...state,
    savedItems: state.savedItems.filter((item) => item.id !== id),
  }))
);
