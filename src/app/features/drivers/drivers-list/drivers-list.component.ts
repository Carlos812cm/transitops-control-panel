import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  shareReplay,
} from 'rxjs';

import { Driver, DriverStatus } from '../../../core/models/driver.model';
import { DriversService } from '../../../core/services/drivers.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { filterBySearch } from '../../../shared/utils/search.utils';

interface DriverFilters {
  search: string;
  status: DriverStatus | '';
}

@Component({
  selector: 'app-drivers-list',
  imports: [
    AsyncPipe,
    EmptyStateComponent,
    HasRoleDirective,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './drivers-list.component.html',
  styleUrls: ['./drivers-list.component.scss'],
})
export class DriversListComponent implements OnInit {
  private readonly driversService = inject(DriversService);
  private readonly languageService = inject(LanguageService);
  private readonly driversSubject = new BehaviorSubject<Driver[]>([]);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<DriverStatus | ''>('', { nonNullable: true }),
  });

  readonly allDrivers$ = this.driversSubject.asObservable();

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

  readonly filteredDrivers$ = combineLatest([this.allDrivers$, this.filters$]).pipe(
    map(([drivers, filters]) => this.filterDrivers(drivers, filters)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.allDrivers$, this.filteredDrivers$, this.filters$]).pipe(
    map(([allDrivers, filteredDrivers, filters]) => ({
      filteredDrivers,
      totalCount: allDrivers.length,
      filteredCount: filteredDrivers.length,
      hasRecords: filteredDrivers.length > 0,
      hasActiveFilters: this.hasActiveFilters(filters),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  updatingDriverId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.driversService.getDrivers().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.driversSubject.next(response.data ?? []);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.t('drivers.error.load');
      },
    });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: '',
    });
  }

  updateDriverStatus(driver: Driver, status: DriverStatus): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.updatingDriverId = driver.id;

    this.driversService.updateDriverStatus(driver.id, status).subscribe({
      next: (response) => {
        this.updatingDriverId = null;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        const updatedDriver = response.data ?? {
          ...driver,
          status,
        };

        this.updateDriverInState(updatedDriver);
        this.successMessage = response.message || this.t('drivers.success.update');
      },
      error: (error) => {
        this.updatingDriverId = null;
        this.errorMessage = error?.error?.message || this.t('drivers.error.update');
      },
    });
  }

  isUpdating(driver: Driver): boolean {
    return this.updatingDriverId === driver.id;
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }

  private filterDrivers(drivers: Driver[], filters: DriverFilters): Driver[] {
    const searchFilteredDrivers = filterBySearch(drivers, filters.search, (driver) => [
      driver.firstName,
      driver.lastName,
      `${driver.firstName} ${driver.lastName}`,
      driver.licenseNumber,
      driver.email,
      driver.phone,
      driver.status,
    ]);

    if (!filters.status) {
      return searchFilteredDrivers;
    }

    return searchFilteredDrivers.filter((driver) => driver.status === filters.status);
  }

  private updateDriverInState(updatedDriver: Driver): void {
    const drivers = this.driversSubject.getValue();

    this.driversSubject.next(
      drivers.map((driver) => (driver.id === updatedDriver.id ? updatedDriver : driver)),
    );
  }

  private hasActiveFilters(filters: DriverFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }
}
