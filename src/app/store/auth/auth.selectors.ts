import { createFeatureSelector, createSelector } from '@ngrx/store';

export interface AuthState {
  loading: boolean;
}

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);
