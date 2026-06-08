import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Driver } from '../../../core/models/driver.model';
import { AuthService } from '../../../core/services/auth.service';
import { DriversService } from '../../../core/services/drivers.service';
import { LanguageService } from '../../../core/services/language.service';
import { DriversListComponent } from './drivers-list.component';

const drivers: Driver[] = [
  {
    id: 'driver-1',
    firstName: 'Alex',
    lastName: 'Rivera',
    licenseNumber: 'LIC-100',
    phone: '555-0100',
    email: 'alex.rivera@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T08:00:00Z'),
    updatedAt: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 'driver-2',
    firstName: 'Marta',
    lastName: 'Lopez',
    licenseNumber: 'LIC-200',
    phone: '555-0200',
    email: 'marta.lopez@example.com',
    status: 'SUSPENDED',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
  },
  {
    id: 'driver-3',
    firstName: 'Diego',
    lastName: 'Santos',
    licenseNumber: 'LIC-300',
    phone: '555-0300',
    email: 'diego.santos@example.com',
    status: 'INACTIVE',
    createdAt: new Date('2026-01-03T08:00:00Z'),
    updatedAt: new Date('2026-01-03T08:00:00Z'),
  },
];

describe('DriversListComponent search', () => {
  let fixture: ComponentFixture<DriversListComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriversListComponent],
      providers: [
        provideRouter([]),
        {
          provide: DriversService,
          useValue: {
            getDrivers: () => of({ success: true, message: 'Drivers loaded.', data: drivers }),
            updateDriverStatus: () =>
              of({ success: true, message: 'Driver updated.', data: drivers[0] }),
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
            currentUser$: of({ id: 1, role: 'ADMIN' }),
            hasRole: () => true,
            getCurrentUser: () => ({ id: 1, role: 'ADMIN' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriversListComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('updates the rendered rows while typing and deleting in the search input', () => {
    const input = getSearchInput();

    expect(renderedRows()).toBe(3);

    enterSearch(input, 'al ri', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Alex Rivera');
    expect(getClearButton().disabled).toBe(false);

    enterSearch(input, 'lex', 'input');
    expect(renderedRows()).toBe(0);
    expect(nativeElement.querySelector('app-empty-state')).not.toBeNull();

    enterSearch(input, 'mar lo', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Marta Lopez');

    enterSearch(input, '', 'input');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('restores the table when the native search clear event or Clear button empties the input', () => {
    const input = getSearchInput();

    enterSearch(input, 'not-a-driver', 'input');
    expect(renderedRows()).toBe(0);

    enterSearch(input, '', 'search');
    expect(renderedRows()).toBe(3);

    enterSearch(input, 'not-a-driver', 'input');
    expect(renderedRows()).toBe(0);

    const clearButton = getClearButton();
    expect(clearButton.disabled).toBe(false);

    clearButton.click();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(renderedRows()).toBe(3);
    expect(clearButton.disabled).toBe(true);
  });

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#driversSearch');

    if (!input) {
      throw new Error('Expected drivers search input to exist.');
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
