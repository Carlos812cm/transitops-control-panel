import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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

import { PaginationMeta } from '../../../core/models/api-response.model';
import { Trip, TripStatus } from '../../../core/models/trip.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { TripsService } from '../../../core/services/trips.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

interface TripFilters {
  search: string;
  status: TripStatus | '';
}

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
    PaginationComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './trips-list.component.html',
  styleUrls: ['./trips-list.component.scss'],
})
export class TripsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tripsService = inject(TripsService);
  private readonly languageService = inject(LanguageService);
  private readonly tripsSubject = new BehaviorSubject<Trip[]>([]);
  private readonly paginationMetaSubject = new BehaviorSubject<PaginationMeta | null>(null);

  private currentPage = 1;
  private currentLimit = 10;

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<TripStatus | ''>('', { nonNullable: true }),
  });

  readonly trips$ = this.tripsSubject.asObservable();
  readonly paginationMeta$ = this.paginationMetaSubject.asObservable();

  private readonly filters$ = merge(
    of(this.filtersForm.getRawValue()),
    this.filtersForm.valueChanges.pipe(
      debounceTime(150),
      map(() => this.filtersForm.getRawValue()),
    ),
  ).pipe(
    distinctUntilChanged(
      (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.trips$, this.paginationMeta$, this.filters$]).pipe(
    map(([trips, meta, filters]) => ({
      trips,
      meta,
      currentCount: trips.length,
      totalCount: meta?.total ?? trips.length,
      hasRecords: trips.length > 0,
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
    this.filters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTrips();
      });
  }

  loadTrips(): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading = true;
    this.errorMessage = '';

    this.tripsService
      .getTrips({
        page: this.currentPage,
        limit: this.currentLimit,
        search: filters.search.trim() || undefined,
        status: filters.status || undefined,
      })
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
          this.paginationMetaSubject.next(response.meta ?? null);
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

  changePage(page: number): void {
    this.currentPage = page;
    this.loadTrips();
  }

  changeLimit(limit: number): void {
    this.currentLimit = limit;
    this.currentPage = 1;
    this.loadTrips();
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

  private refreshTripsSilently(): void {
    const filters = this.filtersForm.getRawValue();

    this.tripsService
      .getTrips({
        page: this.currentPage,
        limit: this.currentLimit,
        search: filters.search.trim() || undefined,
        status: filters.status || undefined,
      })
      .pipe(timeout(15000))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.tripsSubject.next(response.data ?? []);
            this.paginationMetaSubject.next(response.meta ?? null);
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
