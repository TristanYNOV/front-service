import {Component, inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AuthModalComponent} from '../core/shared/modals/auth/auth-modal.component';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [MatIcon, MatIconButton],
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
