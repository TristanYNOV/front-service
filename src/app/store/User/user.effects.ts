import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthApi } from '../../core/api/auth.api';
import { TokenService } from '../../core/services/token.service';
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
import { catchError, map, of, switchMap, tap } from 'rxjs';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private authApi = inject(AuthApi);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  signIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signIn),
      switchMap(({ email, password }) =>
        this.authApi.signIn({ email, password }).pipe(
          map(response => signInSuccess({ email: response.email, tokens: response.tokens })),
          catchError(error => of(signInFailure({ error: error.message })))
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(register),
      switchMap(({ email, password }) =>
        this.authApi.register({ email, password }).pipe(
          map(response => registerSuccess({ email: response.email, tokens: response.tokens })),
          catchError(error => of(registerFailure({ error: error.message })))
        )
      )
    )
  );

  authSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(signInSuccess, registerSuccess),
        tap(({ email, tokens }) => {
          this.tokenService.setTokens(tokens);
          localStorage.setItem('user_email', email);
          this.dialog.closeAll();
          this.router.navigate(['/welcome']);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        tap(() => {
          this.tokenService.clearTokens();
          localStorage.removeItem('user_email');
          this.router.navigate(['/']);
        })
      ),
    { dispatch: false }
  );

  loadInitialState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadInitialState),
      switchMap(() => {
        const tokens = this.tokenService.getTokens();
        const email = localStorage.getItem('user_email');
        if (tokens && email) {
          return of(loadInitialStateSuccess({ email, tokens }));
        }
        return of(loadInitialStateFailed({ error: 'No stored credentials' }));
      })
    )
  );
}
