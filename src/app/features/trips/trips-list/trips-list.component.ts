import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, timeout } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { TripsService } from '../../../core/services/trips.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { Trip, TripStatus } from '../../../core/models/trip.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { matchesSearchQuery } from '../../../shared/utils/search.utils';

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
  private readonly languageService = inject(LanguageService);

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allTrips: Trip[] = [];
  searchTerm = '';
  statusFilter: TripStatus | '' = '';

  updatingTripId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  ngOnInit(): void {
    this.loadTrips();
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 || !!this.statusFilter;
  }

  get trips(): Trip[] {
    return this.allTrips.filter((trip) => {
      const matchesSearch =
        !this.searchTerm ||
        matchesSearchQuery(this.searchTerm, [
          this.getVehicleLabel(trip),
          this.getDriverName(trip),
          this.getRouteLabel(trip),
          trip.notes,
        ]);

      const matchesStatus = !this.statusFilter || trip.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
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
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || this.t('trips.error.load');
        },
      });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.onSearchTermChange(input?.value ?? '');
  }

  clearFilters(searchInput?: HTMLInputElement): void {
    this.searchTerm = '';
    this.statusFilter = '';
    if (searchInput) {
      searchInput.value = '';
    }
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

          this.successMessage = response.message || this.t('trips.success.update');
          this.refreshTripsSilently();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || this.t('trips.error.update');
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
      return this.formatLabelValue(trip.driverId);
    }

    return [trip.driver.firstName, trip.driver.lastName]
      .map((value) => this.formatLabelValue(value))
      .filter(Boolean)
      .join(' ');
  }

  getVehicleLabel(trip: Trip): string {
    if (!trip.vehicle) {
      return this.formatLabelValue(trip.vehicleId);
    }

    const vehicleName = [trip.vehicle.brand, trip.vehicle.model]
      .map((value) => this.formatLabelValue(value))
      .filter(Boolean)
      .join(' ');

    return [trip.vehicle.unitNumber, vehicleName]
      .map((value) => this.formatLabelValue(value))
      .filter(Boolean)
      .join(' - ');
  }

  getRouteLabel(trip: Trip): string {
    if (!trip.route) {
      return this.formatLabelValue(trip.routeId);
    }

    const routeEndpoints = [trip.route.origin, trip.route.destination]
      .map((value) => this.formatLabelValue(value))
      .filter(Boolean)
      .join(' → ');

    return [trip.route.name, routeEndpoints]
      .map((value) => this.formatLabelValue(value))
      .filter(Boolean)
      .join(': ');
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }

  private formatLabelValue(value: unknown): string {
    return String(value ?? '').trim();
  }
}
