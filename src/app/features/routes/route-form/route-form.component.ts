import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { RoutesService } from '../../../core/services/routes.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { CreateRouteRequest, RouteStatus } from '../../../core/models/route.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-route-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './route-form.component.html',
  styleUrls: ['./route-form.component.scss'],
})
export class RouteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly routesService = inject(RoutesService);
  private readonly languageService = inject(LanguageService);

  isSubmitting = false;
  errorMessage = '';

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  routeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    origin: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    destination: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    distanceKm: [1, [Validators.required, Validators.min(1), Validators.max(5000)]],
    estimatedDurationMinutes: [10, [Validators.required, Validators.min(1), Validators.max(1440)]],
    status: this.fb.nonNullable.control<RouteStatus>('ACTIVE', Validators.required),
  });

  get name() {
    return this.routeForm.controls.name;
  }

  get origin() {
    return this.routeForm.controls.origin;
  }

  get destination() {
    return this.routeForm.controls.destination;
  }

  get distanceKm() {
    return this.routeForm.controls.distanceKm;
  }

  get estimatedDurationMinutes() {
    return this.routeForm.controls.estimatedDurationMinutes;
  }

  get status() {
    return this.routeForm.controls.status;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    const formValue = this.routeForm.getRawValue();

    const payload: CreateRouteRequest = {
      name: formValue.name.trim(),
      origin: formValue.origin.trim(),
      destination: formValue.destination.trim(),
      distanceKm: formValue.distanceKm,
      estimatedDurationMinutes: formValue.estimatedDurationMinutes,
      status: formValue.status,
    };

    this.isSubmitting = true;

    this.routesService.createRoute(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.router.navigate(['/routes']);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage = error?.error?.message || this.t('routes.error.create');
      },
    });
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
