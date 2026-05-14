import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../core/shared/modals/auth/auth-modal.component';
import { LayoutEditModeService } from '../core/services/layout-edit-mode.service';
import { AuthSessionService } from '../core/auth/auth-session.service';
import { ThemeModalComponent } from '../core/shared/modals/theme-modal/theme-modal.component';
import { ConfirmDialogComponent } from '../core/shared/modals/confirm-dialog/confirm-dialog.component';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive],
})
export class HeaderComponent {
  @Input({ required: true }) currentSpace!: string;

  readonly dialog = inject(MatDialog);
  protected readonly layoutEditMode = inject(LayoutEditModeService);
  protected readonly authSession = inject(AuthSessionService);

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

  confirmDeleteAccount(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer son compte',
        message:
          'La suppression de votre compte supprimera vos analyses et panneaux privés. Les panneaux publics pourront être conservés sous forme anonymisée afin de préserver les ressources partagées avec la communauté.',
        cancelLabel: 'Annuler',
        confirmLabel: 'Confirmer la suppression',
      },
      width: '560px',
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this.authSession.deleteAccount()),
    ).subscribe();
  }
}
