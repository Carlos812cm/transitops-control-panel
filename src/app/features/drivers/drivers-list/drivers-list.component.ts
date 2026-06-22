import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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

import { PaginationMeta } from '../../../core/models/api-response.model';
import { Driver, DriverStatus } from '../../../core/models/driver.model';
import { DriversService } from '../../../core/services/drivers.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

interface DriverFilters {
  search: string;
  status: DriverStatus | '';
}

@Component({
  selector: 'app-drivers-list',
  standalone: true,
  imports: [
    AsyncPipe,
    EmptyStateComponent,
    HasRoleDirective,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    PaginationComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './drivers-list.component.html',
  styleUrls: ['./drivers-list.component.scss'],
})
export class DriversListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly driversService = inject(DriversService);
  private readonly languageService = inject(LanguageService);
  private readonly driversSubject = new BehaviorSubject<Driver[]>([]);
  private readonly paginationMetaSubject = new BehaviorSubject<PaginationMeta | null>(null);

  private currentPage = 1;
  private currentLimit = 10;

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<DriverStatus | ''>('', { nonNullable: true }),
  });

  readonly drivers$ = this.driversSubject.asObservable();
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

  readonly vm$ = combineLatest([this.drivers$, this.paginationMeta$, this.filters$]).pipe(
    map(([drivers, meta, filters]) => ({
      drivers,
      meta,
      currentCount: drivers.length,
      totalCount: meta?.total ?? drivers.length,
      hasRecords: drivers.length > 0,
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
    this.filters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadDrivers();
      });
  }

  loadDrivers(): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading = true;
    this.errorMessage = '';

    this.driversService
      .getDrivers({
        page: this.currentPage,
        limit: this.currentLimit,
        search: filters.search.trim() || undefined,
        status: filters.status || undefined,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (!response.success) {
            this.errorMessage = response.message;
            return;
          }

          this.driversSubject.next(response.data ?? []);
          this.paginationMetaSubject.next(response.meta ?? null);
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

  changePage(page: number): void {
    this.currentPage = page;
    this.loadDrivers();
  }

  changeLimit(limit: number): void {
    this.currentLimit = limit;
    this.currentPage = 1;
    this.loadDrivers();
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

        this.successMessage = response.message || this.t('drivers.success.update');
        this.loadDrivers();
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

  private hasActiveFilters(filters: DriverFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }
}
