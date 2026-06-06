import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DriversService } from '../../../core/services/drivers.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { CreateDriverRequest, DriverStatus } from '../../../core/models/driver.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-driver-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.scss',
})
export class DriverFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly driversService = inject(DriversService);
  private readonly languageService = inject(LanguageService);

  isSubmitting = false;
  errorMessage = '';

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  driverForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    licenseNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(30)]],
    phone: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    status: this.fb.nonNullable.control<DriverStatus>('ACTIVE', Validators.required),
  });

  get firstName() {
    return this.driverForm.controls.firstName;
  }

  get lastName() {
    return this.driverForm.controls.lastName;
  }

  get licenseNumber() {
    return this.driverForm.controls.licenseNumber;
  }

  get phone() {
    return this.driverForm.controls.phone;
  }

  get email() {
    return this.driverForm.controls.email;
  }

  get status() {
    return this.driverForm.controls.status;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.driverForm.invalid) {
      this.driverForm.markAllAsTouched();
      return;
    }

    const formValue = this.driverForm.getRawValue();

    const payload: CreateDriverRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      licenseNumber: formValue.licenseNumber.trim().toUpperCase(),
      phone: formValue.phone.trim(),
      email: formValue.email.trim().toLowerCase(),
      status: formValue.status,
    };

    this.isSubmitting = true;

    this.driversService.createDriver(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.router.navigate(['/drivers']);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage = error?.error?.message || this.t('drivers.error.create');
      },
    });
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
