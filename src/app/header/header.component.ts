import {Component, inject, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialog} from '@angular/material/dialog';
import {AuthModalComponent} from '../core/shared/modals/auth/auth-modal.component';
import {Store} from '@ngrx/store';
import {logout} from '../store/User/user.actions';
import {selectIsLoggedIn} from '../store/User/user.selectors';
import {LayoutEditModeService} from '../core/services/layout-edit-mode.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, RouterLink],
})
export class HeaderComponent {
  @Input({required: true}) currentSpace!: string;
  private readonly store = inject(Store);
  protected readonly isloggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly dialog = inject(MatDialog);
  protected readonly layoutEditMode = inject(LayoutEditModeService);

  openAuthModal(type: 'login' | 'register'): void {
    this.dialog.open(AuthModalComponent, {
      data: { type }
    });
  }

  logout(): void {
    this.store.dispatch(logout());
  }
}
