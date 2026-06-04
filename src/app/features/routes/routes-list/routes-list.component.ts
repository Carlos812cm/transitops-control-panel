import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RoutesService } from '../../../core/services/routes.service';
import { RouteStatus, TransitRoute } from '../../../core/models/route.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'app-routes-list',
  imports: [
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    HasRoleDirective,
    FormsModule,
  ],
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss'],
})
export class RoutesListComponent implements OnInit {
  private readonly routesService = inject(RoutesService);

  routes: TransitRoute[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allRoutes: TransitRoute[] = [];
  filteredRoutes: TransitRoute[] = [];
  searchTerm = '';
  statusFilter = '';

  updatingRouteId: string | null = null;

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.routesService.getRoutes().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.allRoutes = response.data ?? [];
        this.applyFilters();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Unable to load routes.';
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredRoutes = this.allRoutes.filter((route) => {
      const matchesSearch =
        !search ||
        route.name.toLowerCase().includes(search) ||
        route.origin.toLowerCase().includes(search) ||
        route.destination.toLowerCase().includes(search);

      const matchesStatus = !this.statusFilter || route.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.routes = this.filteredRoutes;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  updateRouteStatus(route: TransitRoute, status: RouteStatus): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.updatingRouteId = route.id;

    this.routesService.updateRouteStatus(route.id, status).subscribe({
      next: (response) => {
        this.updatingRouteId = null;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        const updatedRoute = response.data ?? {
          ...route,
          status,
        };

        this.allRoutes = this.allRoutes.map((item) => (item.id === route.id ? updatedRoute : item));

        this.applyFilters();

        this.successMessage = response.message || 'Route status updated successfully.';
      },
      error: (error) => {
        this.updatingRouteId = null;

        this.errorMessage = error?.error?.message || 'Unable to update route status.';
      },
    });
  }

  isUpdating(route: TransitRoute): boolean {
    return this.updatingRouteId === route.id;
  }
}
