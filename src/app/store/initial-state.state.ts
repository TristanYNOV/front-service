import {DataState, initialDataState} from './Data/dataState.reducers';

export interface AppState {
  dataState: DataState;
}

export const initialAppState: AppState = {
  dataState: initialDataState,
};
