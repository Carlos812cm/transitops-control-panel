import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { PublicRegistrationRole, RegisterRequest } from '../../../core/models/user.model';

const PHONE_PATTERN = /^\+?[0-9 ()-]{8,20}$/;
const PASSWORD_MIN_LENGTH = 8;

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword || password === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);

  readonly requestedRoles: PublicRegistrationRole[] = ['VIEWER', 'OPERATOR', 'SUPERVISOR'];
  isEmailCodeLoading = false;
  isPhoneCodeLoading = false;
  isSubmitting = false;
  isRegistrationSuccessful = false;
  registrationSuccessMessageKey: TranslationKey = 'auth.register.successActiveMessage';
  emailCodeMessage = '';
  phoneCodeMessage = '';
  errorMessage = '';

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  registerForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      phoneCode: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      emailCode: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
      requestedRole: this.fb.nonNullable.control<PublicRegistrationRole>('VIEWER', [
        Validators.required,
      ]),
    },
    {
      validators: passwordMatchValidator,
    },
  );

  get firstName() {
    return this.registerForm.controls.firstName;
  }

  get lastName() {
    return this.registerForm.controls.lastName;
  }

  get phone() {
    return this.registerForm.controls.phone;
  }

  get phoneCode() {
    return this.registerForm.controls.phoneCode;
  }

  get email() {
    return this.registerForm.controls.email;
  }

  get emailCode() {
    return this.registerForm.controls.emailCode;
  }

  get password() {
    return this.registerForm.controls.password;
  }

  get confirmPassword() {
    return this.registerForm.controls.confirmPassword;
  }

  get requestedRole() {
    return this.registerForm.controls.requestedRole;
  }

  get passwordsMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      (this.password.touched || this.confirmPassword.touched)
    );
  }

  isInvalid(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  roleLabelKey(role: PublicRegistrationRole): TranslationKey {
    const roleLabels: Record<PublicRegistrationRole, TranslationKey> = {
      VIEWER: 'auth.register.roleViewer',
      OPERATOR: 'auth.register.roleOperator',
      SUPERVISOR: 'auth.register.roleSupervisor',
    };

    return roleLabels[role];
  }

  requestEmailCode(): void {
    this.emailCodeMessage = '';
    this.errorMessage = '';

    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.isEmailCodeLoading = true;

    this.authService.requestEmailCode({ email: this.email.value.trim().toLowerCase() }).subscribe({
      next: (response) => {
        this.isEmailCodeLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.emailCodeMessage = this.t('auth.register.emailCodeSent');
      },
      error: (error) => {
        this.isEmailCodeLoading = false;
        this.errorMessage = error?.error?.message || this.t('auth.register.emailCodeError');
      },
    });
  }

  requestPhoneCode(): void {
    this.phoneCodeMessage = '';
    this.errorMessage = '';

    if (this.phone.invalid) {
      this.phone.markAsTouched();
      return;
    }

    this.isPhoneCodeLoading = true;

    this.authService.requestPhoneCode({ phone: this.phone.value.trim() }).subscribe({
      next: (response) => {
        this.isPhoneCodeLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.phoneCodeMessage = this.t('auth.register.phoneCodeSent');
      },
      error: (error) => {
        this.isPhoneCodeLoading = false;
        this.errorMessage = error?.error?.message || this.t('auth.register.phoneCodeError');
      },
    });
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();
    const payload: RegisterRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      phone: formValue.phone.trim(),
      phoneCode: formValue.phoneCode.trim(),
      email: formValue.email.trim().toLowerCase(),
      emailCode: formValue.emailCode.trim(),
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      requestedRole: formValue.requestedRole,
    };

    this.isSubmitting = true;

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.isRegistrationSuccessful = true;
        this.registrationSuccessMessageKey =
          response.data?.status === 'PENDING_APPROVAL'
            ? 'auth.register.successPendingMessage'
            : 'auth.register.successActiveMessage';
        this.registerForm.reset({
          firstName: '',
          lastName: '',
          phone: '',
          phoneCode: '',
          email: '',
          emailCode: '',
          password: '',
          confirmPassword: '',
          requestedRole: 'VIEWER',
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message || this.t('auth.register.error');
      },
    });
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
