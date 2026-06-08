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

import { RouteStatus, TransitRoute } from '../../../core/models/route.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { RoutesService } from '../../../core/services/routes.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { filterBySearch } from '../../../shared/utils/search.utils';

interface RouteFilters {
  search: string;
  status: RouteStatus | '';
}

@Component({
  selector: 'app-routes-list',
  imports: [
    AsyncPipe,
    EmptyStateComponent,
    HasRoleDirective,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss'],
})
export class RoutesListComponent implements OnInit {
  private readonly routesService = inject(RoutesService);
  private readonly languageService = inject(LanguageService);
  private readonly routesSubject = new BehaviorSubject<TransitRoute[]>([]);

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<RouteStatus | ''>('', { nonNullable: true }),
  });

  readonly allRoutes$ = this.routesSubject.asObservable();

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

  readonly filteredRoutes$ = combineLatest([this.allRoutes$, this.filters$]).pipe(
    map(([routes, filters]) => this.filterRoutes(routes, filters)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.allRoutes$, this.filteredRoutes$, this.filters$]).pipe(
    map(([allRoutes, filteredRoutes, filters]) => ({
      filteredRoutes,
      totalCount: allRoutes.length,
      filteredCount: filteredRoutes.length,
      hasRecords: filteredRoutes.length > 0,
      hasActiveFilters: this.hasActiveFilters(filters),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  updatingRouteId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

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

        this.routesSubject.next(response.data ?? []);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.t('routes.error.load');
      },
    });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: '',
    });
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

        this.updateRouteInState(updatedRoute);
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

  private filterRoutes(routes: TransitRoute[], filters: RouteFilters): TransitRoute[] {
    const searchFilteredRoutes = filterBySearch(routes, filters.search, (route) => [
      route.name,
      route.origin,
      route.destination,
      `${route.origin} ${route.destination}`,
      route.status,
    ]);

    if (!filters.status) {
      return searchFilteredRoutes;
    }

    return searchFilteredRoutes.filter((route) => route.status === filters.status);
  }

  private updateRouteInState(updatedRoute: TransitRoute): void {
    const routes = this.routesSubject.getValue();

    this.routesSubject.next(
      routes.map((route) => (route.id === updatedRoute.id ? updatedRoute : route)),
    );
  }

  private hasActiveFilters(filters: RouteFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }
}
