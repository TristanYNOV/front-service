import {Component, inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AuthModalComponent} from '../core/shared/modals/auth/auth-modal.component';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
})
export class HeaderComponent {
  @Input({required: true}) currentSpace!: string;
  protected readonly isloggedIn: boolean = false;
  readonly dialog = inject(MatDialog);

  openAuthModal(type: 'login' | 'register'): void {
    this.dialog.open(AuthModalComponent, {
      data: { type }
    });
  }
}
