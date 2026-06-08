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

import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { filterBySearch } from '../../../shared/utils/search.utils';

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
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './vehicles-list.component.html',
  styleUrls: ['./vehicles-list.component.scss'],
})
export class VehiclesListComponent implements OnInit {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly languageService = inject(LanguageService);
  private readonly vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<VehicleStatus | ''>('', { nonNullable: true }),
  });

  readonly allVehicles$ = this.vehiclesSubject.asObservable();

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

  readonly filteredVehicles$ = combineLatest([this.allVehicles$, this.filters$]).pipe(
    map(([vehicles, filters]) => this.filterVehicles(vehicles, filters)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.allVehicles$, this.filteredVehicles$, this.filters$]).pipe(
    map(([allVehicles, filteredVehicles, filters]) => ({
      filteredVehicles,
      totalCount: allVehicles.length,
      filteredCount: filteredVehicles.length,
      hasRecords: filteredVehicles.length > 0,
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
    this.loadVehicles();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: '',
    });
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.vehiclesService.getVehicles().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.vehiclesSubject.next(response.data ?? []);
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

        const updatedVehicle = response.data ?? {
          ...vehicle,
          status,
        };

        this.updateVehicleInState(updatedVehicle);
        this.successMessage = response.message || this.t('vehicles.success.update');
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

  private filterVehicles(vehicles: Vehicle[], filters: VehicleFilters): Vehicle[] {
    const searchFilteredVehicles = filterBySearch(vehicles, filters.search, (vehicle) => [
      vehicle.unitNumber,
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      vehicle.capacity,
      vehicle.status,
    ]);

    if (!filters.status) {
      return searchFilteredVehicles;
    }

    return searchFilteredVehicles.filter((vehicle) => vehicle.status === filters.status);
  }

  private updateVehicleInState(updatedVehicle: Vehicle): void {
    const vehicles = this.vehiclesSubject.getValue();

    this.vehiclesSubject.next(
      vehicles.map((vehicle) => (vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle)),
    );
  }

  private hasActiveFilters(filters: VehicleFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }
}
