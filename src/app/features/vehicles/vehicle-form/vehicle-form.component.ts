import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { VehiclesService } from '../../../core/services/vehicles.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { CreateVehicleRequest, VehicleStatus } from '../../../core/models/vehicle.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss',
})
export class VehicleFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly languageService = inject(LanguageService);

  readonly currentYear = new Date().getFullYear();

  isSubmitting = false;
  errorMessage = '';

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  vehicleForm = this.fb.nonNullable.group({
    unitNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    brand: ['', [Validators.required, Validators.maxLength(60)]],
    model: ['', [Validators.required, Validators.maxLength(60)]],
    year: [
      this.currentYear,
      [Validators.required, Validators.min(1990), Validators.max(this.currentYear + 1)],
    ],
    capacity: [1, [Validators.required, Validators.min(1), Validators.max(120)]],
    status: this.fb.nonNullable.control<VehicleStatus>('AVAILABLE', Validators.required),
    lastMaintenanceDate: [''],
  });

  get unitNumber() {
    return this.vehicleForm.controls.unitNumber;
  }

  get brand() {
    return this.vehicleForm.controls.brand;
  }

  get model() {
    return this.vehicleForm.controls.model;
  }

  get year() {
    return this.vehicleForm.controls.year;
  }

  get capacity() {
    return this.vehicleForm.controls.capacity;
  }

  get status() {
    return this.vehicleForm.controls.status;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehicleForm.getRawValue();

    const payload: CreateVehicleRequest = {
      unitNumber: formValue.unitNumber.trim().toUpperCase(),
      brand: formValue.brand.trim(),
      model: formValue.model.trim(),
      year: formValue.year,
      capacity: formValue.capacity,
      status: formValue.status,
      lastMaintenanceDate: formValue.lastMaintenanceDate
        ? new Date(formValue.lastMaintenanceDate)
        : undefined,
    };

    this.isSubmitting = true;

    this.vehiclesService.createVehicle(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.router.navigate(['/vehicles']);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage = error?.error?.message || this.t('vehicles.error.create');
      },
    });
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
