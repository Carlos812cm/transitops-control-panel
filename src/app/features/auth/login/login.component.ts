import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);

  isLoading = false;
  errorMessage = '';

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;

        this.errorMessage = error?.error?.message || this.t('auth.login.error');
      },
    });
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
