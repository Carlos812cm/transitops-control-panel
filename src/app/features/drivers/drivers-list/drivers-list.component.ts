import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { DriversService } from '../../../core/services/drivers.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { Driver, DriverStatus } from '../../../core/models/driver.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'app-drivers-list',
  imports: [
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    HasRoleDirective,
    FormsModule,
  ],
  templateUrl: './drivers-list.component.html',
  styleUrls: ['./drivers-list.component.scss'],
})
export class DriversListComponent implements OnInit {
  private readonly driversService = inject(DriversService);
  private readonly languageService = inject(LanguageService);

  drivers: Driver[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allDrivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  searchTerm = '';
  statusFilter = '';

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

        this.allDrivers = response.data ?? [];
        this.applyFilters();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.t('drivers.error.load');
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredDrivers = this.allDrivers.filter((driver) => {
      const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        driver.licenseNumber.toLowerCase().includes(search) ||
        driver.email.toLowerCase().includes(search) ||
        driver.phone.toLowerCase().includes(search);

      const matchesStatus = !this.statusFilter || driver.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.drivers = this.filteredDrivers;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
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

        this.allDrivers = this.allDrivers.map((item) =>
          item.id === driver.id ? updatedDriver : item,
        );

        this.applyFilters();

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
}
