import { createAction, props } from '@ngrx/store';
import { AuthTokens } from '../../interfaces/auth.interface';

export const signIn = createAction(
  '[User] Sign In',
  props<{ email: string; password: string }>()
);

export const register = createAction(
  '[User] Register',
  props<{ email: string; password: string }>()
);

export const signInSuccess = createAction(
  '[User] Sign In Success',
  props<{ email: string; tokens: AuthTokens }>()
);

export const registerSuccess = createAction(
  '[User] Register Success',
  props<{ email: string; tokens: AuthTokens }>()
);

export const signInFailure = createAction(
  '[User] Sign In Failure',
  props<{ error: string }>()
);

export const registerFailure = createAction(
  '[User] Register Failure',
  props<{ error: string }>()
);

export const logout = createAction('[User] Logout');
