import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RefreshResponse, RegisterRequest, UserPublicDto } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<string> {
    return this.http.post(environment.authEndpoints.login, payload, {
      responseType: 'text',
      withCredentials: true,
    });
  }

  register(payload: RegisterRequest): Observable<UserPublicDto> {
    return this.http.post<UserPublicDto>(environment.authEndpoints.register, payload, {
      withCredentials: true,
    });
  }

  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(environment.authEndpoints.refresh, {}, {
      withCredentials: true,
    });
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(environment.authEndpoints.logout, {}, {
      withCredentials: true,
    });
  }

  me(): Observable<UserPublicDto> {
    return this.http.get<UserPublicDto>(environment.authEndpoints.me, {
      withCredentials: true,
    });
  }
}
