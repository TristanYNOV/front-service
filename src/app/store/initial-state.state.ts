import { DataState, initialDataState } from './Data/dataState.reducers';
import { UserState, initialUserState } from './User/user.reducer';
import { TimelineState, initialTimelineState } from './Timeline/timeline.reducer';

export interface AppState {
  dataState: DataState;
  userState: UserState;
  timelineState: TimelineState;
}

export const initialAppState: AppState = {
  dataState: initialDataState,
  userState: initialUserState,
  timelineState: initialTimelineState,
};
