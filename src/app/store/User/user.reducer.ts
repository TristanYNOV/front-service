import { createReducer, on } from '@ngrx/store';
import {
  signIn,
  signInSuccess,
  signInFailure,
  register,
  registerSuccess,
  registerFailure,
  logout,
  loadInitialState,
  loadInitialStateSuccess,
  loadInitialStateFailed,
} from './user.actions';

// Interfaces liées au store User
export interface UserTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserState {
  email: string | null;
  tokens: UserTokens | null;
  loading: boolean;
  error: string | null;
}

export const initialUserState: UserState = {
  email: null,
  tokens: null,
  loading: false,
  error: null,
};

export const userReducer = createReducer(
  initialUserState,
  on(signIn, register, loadInitialState, state => ({ ...state, loading: true, error: null })),
  on(signInSuccess, registerSuccess, loadInitialStateSuccess, (state, { email, tokens }) => ({
    ...state,
    loading: false,
    email,
    tokens,
  })),
  on(signInFailure, registerFailure, loadInitialStateFailed, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(logout, () => initialUserState)
);
