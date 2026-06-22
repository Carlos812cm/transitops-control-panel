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
import { RouteStatus, TransitRoute } from '../../../core/models/route.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { RoutesService } from '../../../core/services/routes.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

interface RouteFilters {
  search: string;
  status: RouteStatus | '';
}

@Component({
  selector: 'app-routes-list',
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
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss'],
})
export class RoutesListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly routesService = inject(RoutesService);
  private readonly languageService = inject(LanguageService);
  private readonly routesSubject = new BehaviorSubject<TransitRoute[]>([]);
  private readonly paginationMetaSubject = new BehaviorSubject<PaginationMeta | null>(null);

  private currentPage = 1;
  private currentLimit = 10;

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<RouteStatus | ''>('', { nonNullable: true }),
  });

  readonly routes$ = this.routesSubject.asObservable();
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

  readonly vm$ = combineLatest([this.routes$, this.paginationMeta$, this.filters$]).pipe(
    map(([routes, meta, filters]) => ({
      routes,
      meta,
      currentCount: routes.length,
      totalCount: meta?.total ?? routes.length,
      hasRecords: routes.length > 0,
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
    this.filters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadRoutes();
      });
  }

  loadRoutes(): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading = true;
    this.errorMessage = '';

    this.routesService
      .getRoutes({
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

          this.routesSubject.next(response.data ?? []);
          this.paginationMetaSubject.next(response.meta ?? null);
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

  changePage(page: number): void {
    this.currentPage = page;
    this.loadRoutes();
  }

  changeLimit(limit: number): void {
    this.currentLimit = limit;
    this.currentPage = 1;
    this.loadRoutes();
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

        this.successMessage = response.message || this.t('routes.success.update');
        this.loadRoutes();
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

  private hasActiveFilters(filters: RouteFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }
}
