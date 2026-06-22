import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

interface VehicleFilters {
  search: string;
  status: VehicleStatus | '';
}

@Component({
  selector: 'app-vehicles-list',
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
  templateUrl: './vehicles-list.component.html',
  styleUrls: ['./vehicles-list.component.scss'],
})
export class VehiclesListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly languageService = inject(LanguageService);
  private readonly vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  private readonly paginationMetaSubject = new BehaviorSubject<PaginationMeta | null>(null);

  private currentPage = 1;
  private currentLimit = 10;

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<VehicleStatus | ''>('', { nonNullable: true }),
  });

  readonly vehicles$ = this.vehiclesSubject.asObservable();
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

  readonly vm$ = combineLatest([this.vehicles$, this.paginationMeta$, this.filters$]).pipe(
    map(([vehicles, meta, filters]) => ({
      vehicles,
      meta,
      currentCount: vehicles.length,
      totalCount: meta?.total ?? vehicles.length,
      hasRecords: vehicles.length > 0,
      hasActiveFilters: this.hasActiveFilters(filters),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  updatingVehicleId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  ngOnInit(): void {
    this.filters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadVehicles();
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
    this.loadVehicles();
  }

  changeLimit(limit: number): void {
    this.currentLimit = limit;
    this.currentPage = 1;
    this.loadVehicles();
  }

  loadVehicles(): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading = true;
    this.errorMessage = '';

    this.vehiclesService
      .getVehicles({
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

          this.vehiclesSubject.next(response.data ?? []);
          this.paginationMetaSubject.next(response.meta ?? null);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.error?.message || this.t('vehicles.error.load');
        },
      });
  }

  updateVehicleStatus(vehicle: Vehicle, status: VehicleStatus): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.updatingVehicleId = vehicle.id;

    this.vehiclesService.updateVehicleStatus(vehicle.id, status).subscribe({
      next: (response) => {
        this.updatingVehicleId = null;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.successMessage = response.message || this.t('vehicles.success.update');
        this.loadVehicles();
      },
      error: (error) => {
        this.updatingVehicleId = null;
        this.errorMessage = error?.error?.message || this.t('vehicles.error.update');
      },
    });
  }

  isUpdating(vehicle: Vehicle): boolean {
    return this.updatingVehicleId === vehicle.id;
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }

  private hasActiveFilters(filters: VehicleFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }
}
