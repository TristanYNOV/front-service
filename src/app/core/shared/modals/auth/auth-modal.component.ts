import {Component, Inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
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

  constructor(
    private dialogRef: MatDialogRef<AuthModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AuthModalData
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

  showPasswordHint() {
    return this.form.controls['password'].hasError('minLength') ||
      this.form.controls['password'].hasError('lowercaseMissing') ||
      this.form.controls['password'].hasError('uppercaseMissing') ||
      this.form.controls['password'].hasError('digitMissing') ||
      this.form.controls['password'].hasError('specialCharMissing');
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  submit() {
    const formData = this.form.getRawValue()
    console.log(formData);
  }
}
