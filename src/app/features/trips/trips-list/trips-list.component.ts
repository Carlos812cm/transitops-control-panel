import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { finalize, timeout } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { TripsService } from '../../../core/services/trips.service';
import { Trip, TripStatus } from '../../../core/models/trip.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [
    DatePipe,
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    HasRoleDirective,
    FormsModule,
  ],
  templateUrl: './trips-list.component.html',
  styleUrls: ['./trips-list.component.scss'],
})
export class TripsListComponent implements OnInit {
  private readonly tripsService = inject(TripsService);

  trips: Trip[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allTrips: Trip[] = [];
  filteredTrips: Trip[] = [];
  searchTerm = '';
  statusFilter = '';

  updatingTripId: string | null = null;

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.tripsService
      .getTrips()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMessage = response.message;
            return;
          }

          this.allTrips = response.data ?? [];
          this.applyFilters();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Unable to load trips.';
        },
      });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredTrips = this.allTrips.filter((trip) => {
      const vehicleLabel = this.getVehicleLabel(trip).toLowerCase();
      const driverName = this.getDriverName(trip).toLowerCase();
      const routeLabel = this.getRouteLabel(trip).toLowerCase();
      const notes = (trip.notes ?? '').toLowerCase();

      const matchesSearch =
        !search ||
        vehicleLabel.includes(search) ||
        driverName.includes(search) ||
        routeLabel.includes(search) ||
        notes.includes(search);

      const matchesStatus = !this.statusFilter || trip.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.trips = this.filteredTrips;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  updateTripStatus(trip: Trip, status: TripStatus): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.updatingTripId = trip.id;

    this.tripsService
      .updateTripStatus(trip.id, status)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.updatingTripId = null;
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMessage = response.message;
            return;
          }

          trip.status = status;

          const updatedTrip = response.data ?? {
            ...trip,
            status,
          };

          this.allTrips = this.allTrips.map((item) => (item.id === trip.id ? updatedTrip : item));

          this.applyFilters();

          this.successMessage = response.message || 'Trip status updated successfully.';
          this.refreshTripsSilently();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Unable to update trip status.';
        },
      });
  }

  private refreshTripsSilently(): void {
    this.tripsService
      .getTrips()
      .pipe(timeout(15000))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allTrips = response.data;
            this.applyFilters();
          }
        },
      });
  }

  canStart(trip: Trip): boolean {
    return trip.status === 'SCHEDULED';
  }

  canComplete(trip: Trip): boolean {
    return trip.status === 'IN_PROGRESS';
  }

  canCancel(trip: Trip): boolean {
    return trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS';
  }

  isUpdating(trip: Trip): boolean {
    return this.updatingTripId === trip.id;
  }

  getDriverName(trip: Trip): string {
    if (!trip.driver) {
      return trip.driverId;
    }

    return `${trip.driver.firstName} ${trip.driver.lastName}`;
  }

  getVehicleLabel(trip: Trip): string {
    if (!trip.vehicle) {
      return trip.vehicleId;
    }

    return `${trip.vehicle.unitNumber} - ${trip.vehicle.brand} ${trip.vehicle.model}`;
  }

  getRouteLabel(trip: Trip): string {
    if (!trip.route) {
      return trip.routeId;
    }

    return `${trip.route.name}: ${trip.route.origin} → ${trip.route.destination}`;
  }
}
