import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

type NotificationParams = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  notifySuccess(key: string, params?: NotificationParams, duration = 2500): void {
    this.open(key, params, duration);
  }

  notifyError(key: string, params?: NotificationParams, duration = 3500): void {
    this.open(key, params, duration);
  }

  notifyInfo(key: string, params?: NotificationParams, duration = 3000): void {
    this.open(key, params, duration);
  }

  private open(key: string, params?: NotificationParams, duration?: number): void {
    this.snackBar.open(this.transloco.translate(key, params), this.transloco.translate('actions.close'), {
      ...this.defaultConfig,
      duration: duration ?? this.defaultConfig.duration,
    });
  }
}
