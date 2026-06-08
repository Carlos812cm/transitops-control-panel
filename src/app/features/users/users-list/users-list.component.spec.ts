import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { User, UserStatus } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { UsersService } from '../../../core/services/users.service';
import { UsersListComponent } from './users-list.component';

const users: User[] = [
  {
    id: 1,
    name: 'Luc\u00eda Rojas',
    email: 'lucia.rojas@transitops.com',
    phone: '+1 555 010 1010',
    role: 'OPERATOR',
    requestedRole: 'OPERATOR',
    status: 'ACTIVE',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Martin Lopez',
    email: 'martin.lopez@transitops.com',
    phone: '+1 555 010 2020',
    role: 'SUPERVISOR',
    requestedRole: 'SUPERVISOR',
    status: 'ACTIVE',
    createdAt: '2026-01-02T08:00:00Z',
  },
  {
    id: 3,
    name: 'Ana Perez',
    email: 'ana.perez@transitops.com',
    phone: '+1 555 010 3030',
    role: 'VIEWER',
    requestedRole: 'VIEWER',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-01-03T08:00:00Z',
  },
];

describe('UsersListComponent search', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let nativeElement: HTMLElement;
  let currentUsers: User[];

  beforeEach(async () => {
    currentUsers = users.map((user) => ({ ...user }));

    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [
        provideRouter([]),
        {
          provide: UsersService,
          useValue: {
            getUsers: () => of({ success: true, message: 'Users loaded.', data: currentUsers }),
            approveUser: (id: number) => updateUser(id, 'ACTIVE', 'User approved.'),
            rejectUser: (id: number) => updateUser(id, 'REJECTED', 'User rejected.'),
            updateUserStatus: (id: number, status: UserStatus) =>
              updateUser(id, status, 'User updated.'),
          },
        },
        {
          provide: LanguageService,
          useValue: {
            currentLanguage$: of('en'),
            getCurrentLanguage: () => 'en',
            translate: (key: string) => key,
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser$: of({ id: 99, role: 'ADMIN' }),
            hasRole: () => true,
            getCurrentUser: () => ({ id: 99, role: 'ADMIN' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows all records after loading', () => {
    expect(renderedRows()).toBe(3);
  });

  it('filters while typing without blur by name, email and phone', async () => {
    await enterSearch('lucia');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Luc\u00eda Rojas');

    await enterSearch('martin.lopez');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Martin Lopez');

    await enterSearch('3030');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Ana Perez');

    await enterSearch('');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('combines search, status and role filters', async () => {
    await enterSearch('martin');
    await setStatus('ACTIVE');
    await setRole('SUPERVISOR');

    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Martin Lopez');

    await setRole('OPERATOR');

    expect(renderedRows()).toBe(0);
  });

  it('filters by status and role independently', async () => {
    await setStatus('PENDING_APPROVAL');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Ana Perez');

    await clickClear();
    await setRole('OPERATOR');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Luc\u00eda Rojas');
  });

  it('clears all filters and works multiple times', async () => {
    await enterSearch('martin');
    await setStatus('ACTIVE');
    await setRole('SUPERVISOR');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(fixture.componentInstance.filtersForm.getRawValue()).toEqual({
      search: '',
      status: '',
      role: '',
    });
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);

    await enterSearch('3030');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('recalculates visible rows when a user status changes under an active filter', async () => {
    await setStatus('PENDING_APPROVAL');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Ana Perez');

    fixture.componentInstance.approveUser(currentUsers[2]);
    fixture.detectChanges();

    expect(renderedRows()).toBe(0);
    expect(nativeElement.textContent).not.toContain('Ana Perez');
  });

  function updateUser(id: number, status: UserStatus, message: string) {
    const updatedUser = {
      ...currentUsers.find((user) => user.id === id)!,
      status,
    };

    currentUsers = currentUsers.map((user) => (user.id === id ? updatedUser : user));

    return of({
      success: true,
      message,
      data: updatedUser,
    });
  }

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#usersSearch');

    if (!input) {
      throw new Error('Expected users search input to exist.');
    }

    return input;
  }

  async function enterSearch(value: string): Promise<void> {
    const input = getSearchInput();

    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForDebounce();
  }

  function getStatusFilter(): HTMLSelectElement {
    const select = nativeElement.querySelector<HTMLSelectElement>('#usersStatusFilter');

    if (!select) {
      throw new Error('Expected users status filter to exist.');
    }

    return select;
  }

  function getRoleFilter(): HTMLSelectElement {
    const select = nativeElement.querySelector<HTMLSelectElement>('#usersRoleFilter');

    if (!select) {
      throw new Error('Expected users role filter to exist.');
    }

    return select;
  }

  async function setStatus(value: string): Promise<void> {
    const select = getStatusFilter();

    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForDebounce();
  }

  async function setRole(value: string): Promise<void> {
    const select = getRoleFilter();

    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitForDebounce();
  }

  async function clickClear(): Promise<void> {
    getClearButton().click();
    await waitForDebounce();
  }

  async function waitForDebounce(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 130));
    fixture.detectChanges();
  }

  function renderedRows(): number {
    return nativeElement.querySelectorAll('tbody tr').length;
  }

  function getClearButton(): HTMLButtonElement {
    const button = nativeElement.querySelector<HTMLButtonElement>('.filters-card button');

    if (!button) {
      throw new Error('Expected clear filters button to exist.');
    }

    return button;
  }
});
