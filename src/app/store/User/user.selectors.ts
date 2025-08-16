import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

export const selectUserState = createFeatureSelector<UserState>('userState');

export const selectUserEmail = createSelector(
  selectUserState,
  state => state.email
);

export const selectAuthError = createSelector(
  selectUserState,
  state => state.error
);

export const selectAuthLoading = createSelector(
  selectUserState,
  state => state.loading
);

export const selectIsLoggedIn = createSelector(
  selectUserState,
  state =>
    !!state.email &&
    !!state.tokens?.accessToken &&
    !!state.tokens?.refreshToken
);
