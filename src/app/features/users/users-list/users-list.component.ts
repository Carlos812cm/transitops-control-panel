import { AsyncPipe, DatePipe } from '@angular/common';
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
  Observable,
  of,
  shareReplay,
} from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { User, UserRole, UserStatus } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { UsersService } from '../../../core/services/users.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { filterBySearch } from '../../../shared/utils/search.utils';

interface UserFilters {
  search: string;
  status: UserStatus | '';
  role: UserRole | '';
}

@Component({
  selector: 'app-users-list',
  imports: [
    AsyncPipe,
    DatePipe,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);
  private readonly usersService = inject(UsersService);
  private readonly usersSubject = new BehaviorSubject<User[]>([]);

  readonly statuses: UserStatus[] = [
    'ACTIVE',
    'INACTIVE',
    'PENDING_APPROVAL',
    'REJECTED',
    'SUSPENDED',
  ];
  readonly roles: UserRole[] = ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'];

  readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<UserStatus | ''>('', { nonNullable: true }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true }),
  });

  readonly allUsers$ = this.usersSubject.asObservable();

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

  readonly filteredUsers$ = combineLatest([this.allUsers$, this.filters$]).pipe(
    map(([users, filters]) => this.filterUsers(users, filters)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.allUsers$, this.filteredUsers$, this.filters$]).pipe(
    map(([allUsers, filteredUsers, filters]) => ({
      filteredUsers,
      totalCount: allUsers.length,
      filteredCount: filteredUsers.length,
      activeCount: allUsers.filter((user) => user.status === 'ACTIVE').length,
      pendingCount: allUsers.filter((user) => user.status === 'PENDING_APPROVAL').length,
      restrictedCount: allUsers.filter(
        (user) => user.status === 'REJECTED' || user.status === 'SUSPENDED',
      ).length,
      hasRecords: filteredUsers.length > 0,
      hasActiveFilters: this.hasActiveFilters(filters),
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  updatingUserId: string | null = null;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  private readonly roleTranslationKeys: Record<UserRole, TranslationKey> = {
    ADMIN: 'role.admin',
    OPERATOR: 'role.operator',
    SUPERVISOR: 'role.supervisor',
    VIEWER: 'role.viewer',
  };

  private readonly statusTranslationKeys: Record<UserStatus, TranslationKey> = {
    ACTIVE: 'status.active',
    INACTIVE: 'status.inactive',
    PENDING_APPROVAL: 'status.pendingApproval',
    REJECTED: 'status.rejected',
    SUSPENDED: 'status.suspended',
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersService.getUsers().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        this.usersSubject.next(response.data ?? []);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.t('users.error.load');
      },
    });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: '',
      role: '',
    });
  }

  approveUser(user: User): void {
    this.runUserAction(user, this.usersService.approveUser(user.id), 'users.success.approve');
  }

  rejectUser(user: User): void {
    if (!globalThis.confirm(this.t('users.confirm.reject'))) {
      return;
    }

    this.runUserAction(user, this.usersService.rejectUser(user.id), 'users.success.reject');
  }

  suspendUser(user: User): void {
    if (!globalThis.confirm(this.t('users.confirm.suspend'))) {
      return;
    }

    this.updateUserStatus(user, 'SUSPENDED');
  }

  reactivateUser(user: User): void {
    if (!globalThis.confirm(this.t('users.confirm.reactivate'))) {
      return;
    }

    this.updateUserStatus(user, 'ACTIVE');
  }

  deactivateUser(user: User): void {
    if (!globalThis.confirm(this.t('users.confirm.deactivate'))) {
      return;
    }

    this.updateUserStatus(user, 'INACTIVE');
  }

  canApprove(user: User): boolean {
    return user.status === 'PENDING_APPROVAL';
  }

  canReject(user: User): boolean {
    return user.status === 'PENDING_APPROVAL';
  }

  canSuspend(user: User): boolean {
    return user.status === 'ACTIVE' && !this.isAdminStatusLocked(user);
  }

  canReactivate(user: User): boolean {
    return (
      (user.status === 'SUSPENDED' || user.status === 'INACTIVE') && !this.isAdminStatusLocked(user)
    );
  }

  canDeactivate(user: User): boolean {
    return (
      (user.status === 'ACTIVE' || user.status === 'SUSPENDED') && !this.isAdminStatusLocked(user)
    );
  }

  hasActions(user: User): boolean {
    return (
      this.canApprove(user) ||
      this.canReject(user) ||
      this.canSuspend(user) ||
      this.canReactivate(user) ||
      this.canDeactivate(user)
    );
  }

  isUpdating(user: User): boolean {
    return this.updatingUserId === user.id;
  }

  roleLabel(role?: UserRole | string): string {
    if (!role) {
      return this.t('users.table.notRequested');
    }

    const key = this.roleTranslationKeys[role as UserRole];

    if (!key) {
      return role;
    }

    return this.t(key);
  }

  statusLabel(status: UserStatus): string {
    return this.t(this.statusTranslationKeys[status]);
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }

  private filterUsers(users: User[], filters: UserFilters): User[] {
    const searchFilteredUsers = filterBySearch(users, filters.search, (user) => [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.requestedRole,
      user.status,
    ]);

    return searchFilteredUsers.filter((user) => {
      const matchesStatus = !filters.status || user.status === filters.status;
      const matchesRole = !filters.role || user.role === filters.role;

      return matchesStatus && matchesRole;
    });
  }

  private updateUserStatus(user: User, status: UserStatus): void {
    this.runUserAction(
      user,
      this.usersService.updateUserStatus(user.id, status),
      'users.success.status',
    );
  }

  private runUserAction(
    user: User,
    request: Observable<ApiResponse<User>>,
    fallbackSuccessKey: TranslationKey,
  ): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.updatingUserId = user.id;

    request.subscribe({
      next: (response) => {
        this.updatingUserId = null;

        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }

        if (response.data) {
          this.updateUserInState(response.data);
        }

        this.successMessage = response.message || this.t(fallbackSuccessKey);
      },
      error: (error) => {
        this.updatingUserId = null;
        this.errorMessage = error?.error?.message || this.t('users.error.update');
      },
    });
  }

  private updateUserInState(updatedUser: User): void {
    const users = this.usersSubject.getValue();

    this.usersSubject.next(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
  }

  private hasActiveFilters(filters: UserFilters): boolean {
    return Object.values(filters).some((value) => String(value ?? '').trim().length > 0);
  }

  private isAdminStatusLocked(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();

    return user.role === 'ADMIN' || currentUser?.id === user.id;
  }
}
