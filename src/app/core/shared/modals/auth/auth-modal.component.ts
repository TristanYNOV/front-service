import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
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
  imports: [MatFormField, MatLabel, MatInput, MatError, ReactiveFormsModule],
  standalone: true
})
export class AuthModalComponent {
  hidePassword = true;
  readonly form: FormGroup;
  modalType: 'register' | 'login';

  private dialogRef: MatDialogRef<AuthModalComponent> = inject(MatDialogRef);
  public data = inject<AuthModalData>(MAT_DIALOG_DATA);

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
    const formData = this.form.getRawValue()
    console.log(formData);
  }
}
