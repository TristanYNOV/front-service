import { DataState, initialDataState } from './Data/dataState.reducers';
import { UserState, initialUserState } from './User/user.reducer';

export interface AppState {
  dataState: DataState;
  userState: UserState;
}

export const initialAppState: AppState = {
  dataState: initialDataState,
  userState: initialUserState,
};
