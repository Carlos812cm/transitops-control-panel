import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { User, UserRole, UserStatus } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { UsersService } from '../../../core/services/users.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-users-list',
  imports: [
    DatePipe,
    EmptyStateComponent,
    FormsModule,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);
  private readonly usersService = inject(UsersService);

  readonly statuses: UserStatus[] = [
    'ACTIVE',
    'INACTIVE',
    'PENDING_APPROVAL',
    'REJECTED',
    'SUSPENDED',
  ];
  readonly roles: UserRole[] = ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'];

  allUsers: User[] = [];
  users: User[] = [];
  searchTerm = '';
  statusFilter: UserStatus | '' = '';
  roleFilter: UserRole | '' = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  updatingUserId: number | null = null;

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

  get totalUsers(): number {
    return this.allUsers.length;
  }

  get activeUsers(): number {
    return this.allUsers.filter((user) => user.status === 'ACTIVE').length;
  }

  get pendingUsers(): number {
    return this.allUsers.filter((user) => user.status === 'PENDING_APPROVAL').length;
  }

  get restrictedUsers(): number {
    return this.allUsers.filter(
      (user) => user.status === 'REJECTED' || user.status === 'SUSPENDED',
    ).length;
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

        this.allUsers = response.data ?? [];
        this.applyFilters();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || this.t('users.error.load');
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.users = this.allUsers.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.phone ?? '').toLowerCase().includes(search);

      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.roleFilter = '';
    this.applyFilters();
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
      (user.status === 'SUSPENDED' || user.status === 'INACTIVE') &&
      !this.isAdminStatusLocked(user)
    );
  }

  canDeactivate(user: User): boolean {
    return (
      (user.status === 'ACTIVE' || user.status === 'SUSPENDED') &&
      !this.isAdminStatusLocked(user)
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
          this.allUsers = this.allUsers.map((item) =>
            item.id === response.data?.id ? response.data : item,
          );
          this.applyFilters();
        }

        this.successMessage = response.message || this.t(fallbackSuccessKey);
      },
      error: (error) => {
        this.updatingUserId = null;
        this.errorMessage = error?.error?.message || this.t('users.error.update');
      },
    });
  }

  private isAdminStatusLocked(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();

    return user.role === 'ADMIN' || currentUser?.id === user.id;
  }
}
