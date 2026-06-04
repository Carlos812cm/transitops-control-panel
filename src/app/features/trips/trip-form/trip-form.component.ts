import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { TripsService } from '../../../core/services/trips.service';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { DriversService } from '../../../core/services/drivers.service';
import { RoutesService } from '../../../core/services/routes.service';

import { CreateTripRequest } from '../../../core/models/trip.model';
import { Vehicle } from '../../../core/models/vehicle.model';
import { Driver } from '../../../core/models/driver.model';
import { TransitRoute } from '../../../core/models/route.model';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-trip-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.scss'],
})
export class TripFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly tripsService = inject(TripsService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly driversService = inject(DriversService);
  private readonly routesService = inject(RoutesService);

  availableVehicles: Vehicle[] = [];
  activeDrivers: Driver[] = [];
  activeRoutes: TransitRoute[] = [];

  isLoadingData = false;
  isSubmitting = false;
  errorMessage = '';

  tripForm = this.fb.nonNullable.group({
    vehicleId: ['', [Validators.required]],
    driverId: ['', [Validators.required]],
    routeId: ['', [Validators.required]],
    scheduledDeparture: ['', [Validators.required]],
    notes: [''],
  });

  get vehicleId() {
    return this.tripForm.controls.vehicleId;
  }

  get driverId() {
    return this.tripForm.controls.driverId;
  }

  get routeId() {
    return this.tripForm.controls.routeId;
  }

  get scheduledDeparture() {
    return this.tripForm.controls.scheduledDeparture;
  }

  ngOnInit(): void {
    this.loadCatalogs();
  }

  loadCatalogs(): void {
    this.isLoadingData = true;
    this.errorMessage = '';

    forkJoin({
      vehicles: this.vehiclesService.getVehicles(),
      drivers: this.driversService.getDrivers(),
      routes: this.routesService.getRoutes(),
    }).subscribe({
      next: ({ vehicles, drivers, routes }) => {
        this.isLoadingData = false;

        if (!vehicles.success) {
          this.errorMessage = vehicles.message;
          return;
        }

        if (!drivers.success) {
          this.errorMessage = drivers.message;
          return;
        }

        if (!routes.success) {
          this.errorMessage = routes.message;
          return;
        }

        const vehiclesData = vehicles.data ?? [];
        const driversData = drivers.data ?? [];
        const routesData = routes.data ?? [];

        this.availableVehicles = vehiclesData.filter((vehicle) =>
          this.isVehicleSelectable(vehicle),
        );

        this.activeDrivers = driversData.filter((driver) => driver.status === 'ACTIVE');

        this.activeRoutes = routesData.filter((route) => route.status === 'ACTIVE');
      },
      error: (error) => {
        this.isLoadingData = false;

        this.errorMessage = error?.error?.message || 'Unable to load trip form data.';
      },
    });
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const formValue = this.tripForm.getRawValue();

    const payload: CreateTripRequest = {
      vehicleId: formValue.vehicleId,
      driverId: formValue.driverId,
      routeId: formValue.routeId,
      scheduledDeparture: new Date(formValue.scheduledDeparture),
      notes: formValue.notes.trim() || undefined,
    };

    this.isSubmitting = true;

    this.tripsService.createTrip(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.router.navigate(['/trips']);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage = error?.error?.message || 'Unable to create trip.';
      },
    });
  }

  private isVehicleSelectable(vehicle: Vehicle): boolean {
    return vehicle.status === 'AVAILABLE';
  }
}
