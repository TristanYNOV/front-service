import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {MatError, MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { LoadingDotsComponent } from '../../../../components/loading-dots';
import {
  digitValidator,
  lowercaseValidator,
  minLengthValidator,
  specialCharValidator,
  uppercaseValidator,
} from '../../../utils/validators/password.validator';
import { AuthSessionService } from '../../../auth/auth-session.service';

interface AuthModalData {
  type: 'login' | 'register';
}

type AuthForm = FormGroup<{
  pseudo: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  imports: [
    MatFormField,
    MatHint,
    MatLabel,
    MatInput,
    MatError,
    ReactiveFormsModule,
    LoadingDotsComponent,
    MatButtonModule,
    MatIconModule,
  ],
  standalone: true,
})
export class AuthModalComponent {
  public readonly data = inject<AuthModalData>(MAT_DIALOG_DATA);
  private readonly authSession = inject(AuthSessionService);
  private readonly dialogRef = inject(MatDialogRef<AuthModalComponent>);

  hidePassword = true;
  modalType: 'register' | 'login';
  isSubmitting = false;
  backendError: string | null = null;

  readonly form: AuthForm;

  constructor() {
    this.modalType = this.data.type === 'login' ? 'login' : 'register';
    this.form = new FormGroup({
      pseudo: new FormControl('', { nonNullable: true }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: this.getPasswordValidators('login') }),
    });
  }

  shouldShowPasswordErrors(): boolean {
    const control = this.form.controls.password;
    return this.modalType === 'register' && control.invalid && (control.dirty || control.touched);
  }

  toggleMode(): void {
    this.modalType = this.modalType === 'login' ? 'register' : 'login';
    this.form.controls.password.setValidators(this.getPasswordValidators(this.modalType));
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({ pseudo: '', email: '', password: '' });
    this.backendError = null;
    this.hidePassword = true;
  }

  closeModal(): void {
    this.resetSensitiveFields();
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.backendError = null;
    this.isSubmitting = true;

    const { pseudo, email, password } = this.form.getRawValue();
    const authRequest$ =
      this.modalType === 'login'
        ? this.authSession.login(email, password)
        : this.authSession.register(email, password, pseudo);

    authRequest$
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.resetSensitiveFields();
          this.dialogRef.close();
        },
        error: error => {
          this.backendError = this.getErrorMessage(error);
        },
      });
  }

  private getPasswordValidators(mode: 'login' | 'register') {
    if (mode === 'login') {
      // Login: validation volontairement minimale (email + mot de passe requis).
      return [Validators.required];
    }

    // Register: aligné sur la policy backend documentée.
    return [
      Validators.required,
      minLengthValidator(8),
      lowercaseValidator(),
      uppercaseValidator(),
      digitValidator(),
      specialCharValidator(),
    ];
  }

  private resetSensitiveFields(): void {
    this.form.controls.password.reset('');
    this.hidePassword = true;
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const candidate = (error as { error?: { message?: string } }).error?.message;
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
