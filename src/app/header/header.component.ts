import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { filter, switchMap } from 'rxjs';
import { AuthModalComponent } from '../core/shared/modals/auth/auth-modal.component';
import { LayoutEditModeService } from '../core/services/layout-edit-mode.service';
import { AuthSessionService } from '../core/auth/auth-session.service';
import { ThemeModalComponent } from '../core/shared/modals/theme-modal/theme-modal.component';
import { ConfirmDialogComponent } from '../core/shared/modals/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../core/i18n/language.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, TranslocoPipe],
})
export class HeaderComponent {
  @Input({ required: true }) currentSpace!: string;

  readonly dialog = inject(MatDialog);
  protected readonly layoutEditMode = inject(LayoutEditModeService);
  protected readonly authSession = inject(AuthSessionService);
  protected readonly languageService = inject(LanguageService);
  protected readonly languages = this.languageService.getAvailableLangs();
  private readonly transloco = inject(TranslocoService);

  openAuthModal(type: 'login' | 'register'): void {
    this.dialog.open(AuthModalComponent, {
      data: { type },
    });
  }

  logout(): void {
    this.authSession.logout().subscribe();
  }

  openThemeModal(): void {
    this.dialog.open(ThemeModalComponent, {
      width: '420px',
    });
  }

  setLanguage(value: string): void {
    if (this.languageService.isValidLang(value)) {
      this.languageService.setLang(value);
    }
  }

  confirmDeleteAccount(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('auth.deleteAccountTitle'),
        message: this.transloco.translate('auth.deleteAccountMessage'),
        cancelLabel: this.transloco.translate('actions.cancel'),
        confirmLabel: this.transloco.translate('auth.confirmDeleteAccount'),
      },
      width: '560px',
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this.authSession.deleteAccount()),
    ).subscribe();
  }
}
