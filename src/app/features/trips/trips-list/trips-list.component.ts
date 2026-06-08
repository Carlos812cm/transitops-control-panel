import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  of,
  shareReplay,
  timeout,
} from 'rxjs';

import { Trip, TripStatus } from '../../../core/models/trip.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { TripsService } from '../../../core/services/trips.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { filterBySearch } from '../../../shared/utils/search.utils';

interface TripFilters {
  search: string;
  status: TripStatus | '';
}

type TripWithOptionalSchedule = Trip & {
  scheduledStart?: unknown;
  scheduledEnd?: unknown;
};

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    EmptyStateComponent,
    HasRoleDirective,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './trips-list.component.html',
  styleUrls: ['./trips-list.component.scss'],
})
export class TripsListComponent implements OnInit {
  private readonly tripsService = inject(TripsService);
  private readonly languageService = inject(LanguageService);
  private readonly tripsSubject = new BehaviorSubject<Trip[]>([]);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<TripStatus | ''>('', { nonNullable: true }),
  });

  readonly allTrips$ = this.tripsSubject.asObservable();

  private readonly filters$ = merge(
    of(this.filtersForm.getRawValue()),
    this.filtersForm.valueChanges.pipe(
      debounceTime(100),
      map(() => this.filtersForm.getRawValue()),
    ),
  ).pipe(
    distinctUntilChanged(
      (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly filteredTrips$ = combineLatest([this.allTrips$, this.filters$]).pipe(
    map(([trips, filters]) => this.filterTrips(trips, filters)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.allTrips$, this.filteredTrips$, this.filters$]).pipe(
    map(([allTrips, filteredTrips, filters]) => ({
      filteredTrips,
      totalCount: allTrips.length,
      filteredCount: filteredTrips.length,
      hasRecords: filteredTrips.length > 0,
      hasActiveFilters: this.hasActiveFilters(filters),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  updatingTripId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

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

          this.tripsSubject.next(response.data ?? []);
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || this.t('trips.error.load');
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: '',
    });
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

          const updatedTrip = response.data ?? {
            ...trip,
            status,
          };

          this.updateTripInState(updatedTrip);
          this.successMessage = response.message || this.t('trips.success.update');
          this.refreshTripsSilently();
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || this.t('trips.error.update');
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
      .join(' -> ');

    return [trip.route.name, routeEndpoints]
      .map((value) => this.formatLabelValue(value))
      .filter(Boolean)
      .join(': ');
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }

  private filterTrips(trips: Trip[], filters: TripFilters): Trip[] {
    const searchFilteredTrips = filterBySearch(trips, filters.search, (trip) =>
      this.getTripSearchValues(trip),
    );

    if (!filters.status) {
      return searchFilteredTrips;
    }

    return searchFilteredTrips.filter((trip) => trip.status === filters.status);
  }

  private getTripSearchValues(trip: Trip): unknown[] {
    const tripWithSchedule = trip as TripWithOptionalSchedule;

    return [
      trip.vehicle?.unitNumber,
      trip.vehicle?.brand,
      trip.vehicle?.model,
      this.getVehicleLabel(trip),
      trip.driver?.firstName,
      trip.driver?.lastName,
      this.getDriverName(trip),
      trip.route?.name,
      trip.route?.origin,
      trip.route?.destination,
      this.getRouteLabel(trip),
      trip.status,
      trip.notes,
      trip.scheduledDeparture,
      tripWithSchedule.scheduledStart,
      tripWithSchedule.scheduledEnd,
    ];
  }

  private updateTripInState(updatedTrip: Trip): void {
    const trips = this.tripsSubject.getValue();

    this.tripsSubject.next(
      trips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)),
    );
  }

  private refreshTripsSilently(): void {
    this.tripsService
      .getTrips()
      .pipe(timeout(15000))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tripsSubject.next(response.data);
          }
        },
      });
  }

  private hasActiveFilters(filters: TripFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }

  private formatLabelValue(value: unknown): string {
    return String(value ?? '').trim();
  }
}
