import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { VehiclesService } from '../../../core/services/vehicles.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { matchesSearchQuery } from '../../../shared/utils/search.utils';

@Component({
  selector: 'app-vehicles-list',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    HasRoleDirective,
    FormsModule,
  ],
  templateUrl: './vehicles-list.component.html',
  styleUrls: ['./vehicles-list.component.scss'],
})
export class VehiclesListComponent implements OnInit {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly languageService = inject(LanguageService);

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allVehicles: Vehicle[] = [];
  searchTerm = '';
  statusFilter: VehicleStatus | '' = '';

  updatingVehicleId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  ngOnInit(): void {
    this.loadVehicles();
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 || !!this.statusFilter;
  }

  get vehicles(): Vehicle[] {
    return this.allVehicles.filter((vehicle) => {
      const matchesSearch =
        !this.searchTerm ||
        matchesSearchQuery(this.searchTerm, [vehicle.unitNumber, vehicle.brand, vehicle.model]);

      const matchesStatus = !this.statusFilter || vehicle.status === this.statusFilter;

      return matchesSearch && matchesStatus;
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

        this.allVehicles = response.data ?? [];
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

        this.allVehicles = this.allVehicles.map((item) =>
          item.id === vehicle.id ? updatedVehicle : item,
        );

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
}
