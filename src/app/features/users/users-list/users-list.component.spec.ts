import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { UsersService } from '../../../core/services/users.service';
import { UsersListComponent } from './users-list.component';

const users: User[] = [
  {
    id: 1,
    name: 'Admin Demo',
    email: 'admin@transitops.com',
    phone: '+1 555 010 1000',
    role: 'ADMIN',
    requestedRole: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Operator Demo',
    email: 'operator@transitops.com',
    phone: '+1 555 010 1001',
    role: 'OPERATOR',
    requestedRole: 'OPERATOR',
    status: 'ACTIVE',
    createdAt: '2026-01-02T08:00:00Z',
  },
  {
    id: 3,
    name: 'Viewer Pending',
    email: 'viewer.pending@transitops.com',
    phone: '+1 555 010 1002',
    role: 'VIEWER',
    requestedRole: 'VIEWER',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-01-03T08:00:00Z',
  },
];

describe('UsersListComponent search', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [
        provideRouter([]),
        {
          provide: UsersService,
          useValue: {
            getUsers: () => of({ success: true, message: 'Users loaded.', data: users }),
            approveUser: () => of({ success: true, message: 'User approved.', data: users[0] }),
            rejectUser: () => of({ success: true, message: 'User rejected.', data: users[0] }),
            updateUserStatus: () => of({ success: true, message: 'User updated.', data: users[0] }),
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

  it('keeps the reference user-search behavior while typing, recovering and clearing', () => {
    const input = getSearchInput();

    expect(renderedRows()).toBe(3);

    enterSearch(input, 'ope de', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Operator Demo');
    expect(getClearButton().disabled).toBe(false);

    enterSearch(input, 'pera', 'input');
    expect(renderedRows()).toBe(0);
    expect(nativeElement.querySelector('app-empty-state')).not.toBeNull();

    enterSearch(input, 'vie pen', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Viewer Pending');

    const clearButton = getClearButton();
    clearButton.click();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(renderedRows()).toBe(3);
    expect(clearButton.disabled).toBe(true);
  });

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#usersSearch');

    if (!input) {
      throw new Error('Expected users search input to exist.');
    }

    return input;
  }

  function enterSearch(
    input: HTMLInputElement,
    value: string,
    eventName: 'input' | 'search',
  ): void {
    input.value = value;
    input.dispatchEvent(new Event(eventName, { bubbles: true }));
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
