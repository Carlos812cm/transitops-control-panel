import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { DashboardService } from '../../core/services/dashboard.service';
import { LanguageService, TranslationKey } from '../../core/services/language.service';

import { Trip } from '../../core/models/trip.model';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface DashboardViewStats {
  totalVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  inactiveVehicles: number;

  totalDrivers: number;
  activeDrivers: number;
  suspendedDrivers: number;
  inactiveDrivers: number;

  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;

  totalTrips: number;
  scheduledTrips: number;
  inProgressTrips: number;
  completedTrips: number;
  cancelledTrips: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly languageService = inject(LanguageService);

  isLoading = false;
  errorMessage = '';

  latestTrips: Trip[] = [];

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  stats: DashboardViewStats = {
    totalVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
    inactiveVehicles: 0,

    totalDrivers: 0,
    activeDrivers: 0,
    suspendedDrivers: 0,
    inactiveDrivers: 0,

    totalRoutes: 0,
    activeRoutes: 0,
    inactiveRoutes: 0,

    totalTrips: 0,
    scheduledTrips: 0,
    inProgressTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getSummary().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success || !response.data) {
          this.errorMessage = response.message || this.t('dashboard.error.load');
          return;
        }

        const summaryStats = response.data.stats;

        this.stats = {
          totalVehicles: summaryStats.totalVehicles,
          availableVehicles: summaryStats.availableVehicles,
          maintenanceVehicles: summaryStats.maintenanceVehicles,
          inactiveVehicles: Math.max(
            summaryStats.totalVehicles -
              summaryStats.availableVehicles -
              summaryStats.maintenanceVehicles,
            0,
          ),

          totalDrivers: summaryStats.totalDrivers,
          activeDrivers: summaryStats.activeDrivers,
          suspendedDrivers: summaryStats.suspendedDrivers,
          inactiveDrivers: Math.max(
            summaryStats.totalDrivers - summaryStats.activeDrivers - summaryStats.suspendedDrivers,
            0,
          ),

          totalRoutes: summaryStats.totalRoutes,
          activeRoutes: summaryStats.activeRoutes,
          inactiveRoutes: Math.max(summaryStats.totalRoutes - summaryStats.activeRoutes, 0),

          totalTrips: summaryStats.totalTrips,
          scheduledTrips: summaryStats.scheduledTrips,
          inProgressTrips: summaryStats.inProgressTrips,
          completedTrips: summaryStats.completedTrips,
          cancelledTrips: summaryStats.cancelledTrips,
        };

        this.latestTrips = [...(response.data.latestTrips ?? [])]
          .sort((a, b) => {
            return (
              new Date(b.scheduledDeparture).getTime() - new Date(a.scheduledDeparture).getTime()
            );
          })
          .slice(0, 5);
      },
      error: (error) => {
        this.isLoading = false;

        this.errorMessage = error?.error?.message || this.t('dashboard.error.load');
      },
    });
  }

  getDriverName(trip: Trip): string {
    if (!trip.driver) {
      return trip.driverId;
    }

    return `${trip.driver.firstName} ${trip.driver.lastName}`;
  }

  getVehicleLabel(trip: Trip): string {
    if (!trip.vehicle) {
      return trip.vehicleId;
    }

    return `${trip.vehicle.unitNumber} - ${trip.vehicle.brand} ${trip.vehicle.model}`;
  }

  getRouteLabel(trip: Trip): string {
    if (!trip.route) {
      return trip.routeId;
    }

    return `${trip.route.name}: ${trip.route.origin} \u2192 ${trip.route.destination}`;
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
