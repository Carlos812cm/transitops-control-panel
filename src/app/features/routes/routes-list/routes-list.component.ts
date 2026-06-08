import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { RoutesService } from '../../../core/services/routes.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { RouteStatus, TransitRoute } from '../../../core/models/route.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { matchesSearchQuery } from '../../../shared/utils/search.utils';

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
  private readonly languageService = inject(LanguageService);

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  allRoutes: TransitRoute[] = [];
  searchTerm = '';
  statusFilter: RouteStatus | '' = '';

  updatingRouteId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  ngOnInit(): void {
    this.loadRoutes();
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 || !!this.statusFilter;
  }

  get routes(): TransitRoute[] {
    return this.allRoutes.filter((route) => {
      const matchesSearch =
        !this.searchTerm ||
        matchesSearchQuery(this.searchTerm, [route.name, route.origin, route.destination]);

      const matchesStatus = !this.statusFilter || route.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
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
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.t('routes.error.load');
      },
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

        this.successMessage = response.message || this.t('routes.success.update');
      },
      error: (error) => {
        this.updatingRouteId = null;

        this.errorMessage = error?.error?.message || this.t('routes.error.update');
      },
    });
  }

  isUpdating(route: TransitRoute): boolean {
    return this.updatingRouteId === route.id;
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
