import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { signIn, register } from '../../../../store/User/user.actions';
import { selectAuthError, selectAuthLoading } from '../../../../store/User/user.selectors';
import { LoadingDotsComponent } from '../../../../components/loading-dots';

import {
  digitValidator,
  lowercaseValidator,
  minLengthValidator,
  specialCharValidator,
  uppercaseValidator
} from '../../../utils/validators/password.validator';

interface AuthModalData {
  type: 'login' | 'register';
}

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    ReactiveFormsModule,
    AsyncPipe,
    LoadingDotsComponent,
  ],
  standalone: true
})
export class AuthModalComponent {
  private store = inject(Store);
  public data = inject<AuthModalData>(MAT_DIALOG_DATA);

  error$ = this.store.select(selectAuthError);
  loading$ = this.store.select(selectAuthLoading);

  hidePassword = true;
  readonly form: FormGroup;
  modalType: 'register' | 'login';

  private dialogRef: MatDialogRef<AuthModalComponent> = inject(MatDialogRef);

  constructor(
  ) {
    this.modalType = this.data.type === 'login' ? 'login' : 'register';
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required,
        minLengthValidator(8),
        lowercaseValidator(),
        uppercaseValidator(),
        digitValidator(),
        specialCharValidator()]),
    })
  }

  shouldShowPasswordErrors(): boolean {
    const control = this.form.get('password');
    return this.modalType === 'register' && !!control && control.invalid && (control.dirty || control.touched);
  }

  toggleMode(): void {
    this.modalType = this.modalType === 'login' ? 'register' : 'login';
    this.form.reset();
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    if (this.modalType === 'login') {
      this.store.dispatch(signIn({ email, password }));
    } else {
      this.store.dispatch(register({ email, password }));
    }
  }
}
