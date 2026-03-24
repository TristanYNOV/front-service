import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../core/shared/modals/auth/auth-modal.component';
import { LayoutEditModeService } from '../core/services/layout-edit-mode.service';
import { AuthSessionService } from '../core/auth/auth-session.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatIconModule, RouterLink],
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
}
