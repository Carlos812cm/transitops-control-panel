import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiErrorResponse } from '../../core/models/api-response.model';
import { AppLanguage } from '../../core/models/language.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService, TranslationKey } from '../../core/services/language.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

const avatarMaxFileSizeBytes = 2 * 1024 * 1024;

const allowedAvatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!newPassword || !confirmPassword || newPassword === confirmPassword) {
    return null;
  }

  return {
    passwordMismatch: true,
  };
}

@Component({
  selector: 'app-settings',
  imports: [PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly languageService = inject(LanguageService);

  readonly isSavingProfile = signal(false);
  readonly isChangingPassword = signal(false);

  readonly profileSuccess = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly isUploadingAvatar = signal(false);
  readonly isDeletingAvatar = signal(false);

  readonly avatarSuccess = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);
  readonly avatarPreviewUrl = signal<string | null>(null);

  readonly currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  readonly currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUser(),
  });

  readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(25)]],
    currentPassword: ['', [Validators.maxLength(72)]],
  });

  readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.maxLength(72)]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          Validators.pattern(/^(?=.*\p{L})(?=.*\d).+$/u),
        ],
      ],
      confirmPassword: ['', [Validators.required, Validators.maxLength(72)]],
    },
    {
      validators: passwordMatchValidator,
    },
  );

  readonly languageOptions: readonly {
    code: AppLanguage;
    labelKey: TranslationKey;
  }[] = [
    {
      code: 'en',
      labelKey: 'settings.language.english',
    },
    {
      code: 'es',
      labelKey: 'settings.language.spanish',
    },
  ];

  ngOnDestroy(): void {
    this.clearAvatarPreview();
  }

  selectAvatar(event: Event): void {
    this.avatarSuccess.set(null);
    this.avatarError.set(null);

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file) {
      return;
    }

    if (!allowedAvatarMimeTypes.has(file.type)) {
      this.avatarError.set('Avatar must be a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > avatarMaxFileSizeBytes) {
      this.avatarError.set('Avatar file must not exceed 2 MB.');
      return;
    }

    this.setAvatarPreview(file);
    this.uploadAvatar(file);
  }

  deleteAvatar(): void {
    this.avatarSuccess.set(null);
    this.avatarError.set(null);

    const user = this.currentUser();

    if (!user?.avatarUrl) {
      this.avatarError.set('There is no avatar to delete.');
      return;
    }

    this.isDeletingAvatar.set(true);

    this.authService
      .deleteAvatar()
      .pipe(
        finalize(() => {
          this.isDeletingAvatar.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.clearAvatarPreview();
          this.avatarSuccess.set(response.message || 'Avatar deleted successfully.');
        },
        error: (error: unknown) => {
          this.avatarError.set(this.getErrorMessage(error, 'Avatar could not be deleted.'));
        },
      });
  }

  getVisibleAvatarUrl(user: User): string | null {
    return this.avatarPreviewUrl() || this.getAvatarUrl(user);
  }

  constructor() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user && !this.isSavingProfile()) {
        this.patchProfileForm(user);
      }
    });

    const user = this.authService.getCurrentUser();

    if (user) {
      this.patchProfileForm(user);
    }
  }

  saveProfile(): void {
    this.profileSuccess.set(null);
    this.profileError.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();

    if (!user) {
      this.profileError.set('There is no authenticated user loaded.');
      return;
    }

    const formValue = this.profileForm.getRawValue();
    const emailChanged = formValue.email.trim().toLowerCase() !== user.email.toLowerCase();

    if (emailChanged && !formValue.currentPassword.trim()) {
      this.profileForm.controls.currentPassword.markAsTouched();
      this.profileError.set('Current password is required when changing your email.');
      return;
    }

    this.isSavingProfile.set(true);

    this.authService
      .updateProfile({
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        email: formValue.email.trim().toLowerCase(),
        phone: formValue.phone.trim(),
        currentPassword: formValue.currentPassword.trim() || undefined,
      })
      .pipe(
        finalize(() => {
          this.isSavingProfile.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.profileForm.controls.currentPassword.reset('');
          this.profileSuccess.set(response.message || 'Profile updated successfully.');
        },
        error: (error: unknown) => {
          this.profileError.set(this.getErrorMessage(error, 'Profile could not be updated.'));
        },
      });
  }

  changePassword(): void {
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const formValue = this.passwordForm.getRawValue();

    this.isChangingPassword.set(true);

    this.authService
      .changePassword({
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword,
        confirmPassword: formValue.confirmPassword,
      })
      .pipe(
        finalize(() => {
          this.isChangingPassword.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.passwordSuccess.set('Password updated successfully. Please sign in again.');
          this.passwordForm.reset();
        },
        error: (error: unknown) => {
          this.passwordError.set(this.getErrorMessage(error, 'Password could not be updated.'));
        },
      });
  }

  setLanguage(language: AppLanguage): void {
    this.languageService.setLanguage(language);
  }

  getDisplayName(user: User): string {
    const structuredName = [user.firstName, user.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ');

    return structuredName || user.name || user.email;
  }

  getInitials(user: User): string {
    return this.getDisplayName(user)
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getAvatarUrl(user: User): string | null {
    return this.authService.getAvatarUrl(user.avatarUrl);
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }

  private patchProfileForm(user: User): void {
    this.profileForm.patchValue(
      {
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        currentPassword: '',
      },
      {
        emitEvent: false,
      },
    );
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as ApiErrorResponse | undefined;
      const fieldErrors = response?.errors ? Object.values(response.errors).flat() : [];

      return fieldErrors[0] || response?.message || fallbackMessage;
    }

    return fallbackMessage;
  }

  private uploadAvatar(file: File): void {
    this.isUploadingAvatar.set(true);

    this.authService
      .updateAvatar(file)
      .pipe(
        finalize(() => {
          this.isUploadingAvatar.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.clearAvatarPreview();
          this.avatarSuccess.set(response.message || 'Avatar updated successfully.');
        },
        error: (error: unknown) => {
          this.clearAvatarPreview();
          this.avatarError.set(this.getErrorMessage(error, 'Avatar could not be updated.'));
        },
      });
  }

  private setAvatarPreview(file: File): void {
    this.clearAvatarPreview();

    const previewUrl = URL.createObjectURL(file);

    this.avatarPreviewUrl.set(previewUrl);
  }

  private clearAvatarPreview(): void {
    const previewUrl = this.avatarPreviewUrl();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    this.avatarPreviewUrl.set(null);
  }
}
