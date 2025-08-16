import {Component, inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AuthModalComponent} from '../core/shared/modals/auth/auth-modal.component';
import {Store} from '@ngrx/store';
import {logout} from '../store/User/user.actions';
import {selectIsLoggedIn} from '../store/User/user.selectors';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent {
  @Input({required: true}) currentSpace!: string;
  private readonly store = inject(Store);
  protected readonly isloggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly dialog = inject(MatDialog);

  openAuthModal(type: 'login' | 'register'): void {
    this.dialog.open(AuthModalComponent, {
      data: { type }
    });
  }

  logout(): void {
    this.store.dispatch(logout());
  }
}
