import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Vérifie la longueur minimale
export function minLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.value && control.value.length >= minLength ? null : { minLength: true };
  };
}

// Vérifie la présence d'une lettre minuscule
export function lowercaseValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return /[a-z]/.test(control.value) ? null : { lowercaseMissing: true };
  };
}

// Vérifie la présence d'une lettre majuscule
export function uppercaseValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return /[A-Z]/.test(control.value) ? null : { uppercaseMissing: true };
  };
}

// Vérifie la présence d'un chiffre
export function digitValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return /\d/.test(control.value) ? null : { digitMissing: true };
  };
}

// Vérifie la présence d'un caractère spécial
export function specialCharValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return /[\W_]/.test(control.value) ? null : { specialCharMissing: true };
  };
}
