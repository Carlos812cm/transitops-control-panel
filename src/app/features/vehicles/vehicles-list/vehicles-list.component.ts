import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VehiclesService } from '../../../core/services/vehicles.service';
import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

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

  vehicles: Vehicle[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allVehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  searchTerm = '';
  statusFilter = '';

  updatingVehicleId: string | null = null;

  ngOnInit(): void {
    this.loadVehicles();
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredVehicles = this.allVehicles.filter((vehicle) => {
      const matchesSearch =
        !search ||
        vehicle.unitNumber.toLowerCase().includes(search) ||
        vehicle.brand.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search);

      const matchesStatus = !this.statusFilter || vehicle.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.vehicles = this.filteredVehicles;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
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
        this.applyFilters();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Unable to load vehicles.';
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

        this.applyFilters();

        this.successMessage = response.message || 'Vehicle status updated successfully.';
      },
      error: (error) => {
        this.updatingVehicleId = null;

        this.errorMessage = error?.error?.message || 'Unable to update vehicle status.';
      },
    });
  }

  isUpdating(vehicle: Vehicle): boolean {
    return this.updatingVehicleId === vehicle.id;
  }
}
