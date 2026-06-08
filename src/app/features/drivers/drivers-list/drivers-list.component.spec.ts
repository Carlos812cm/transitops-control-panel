import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Driver, DriverStatus } from '../../../core/models/driver.model';
import { AuthService } from '../../../core/services/auth.service';
import { DriversService } from '../../../core/services/drivers.service';
import { LanguageService } from '../../../core/services/language.service';
import { DriversListComponent } from './drivers-list.component';

const drivers: Driver[] = [
  {
    id: 'driver-1',
    firstName: 'Luc\u00eda',
    lastName: 'Rojas',
    licenseNumber: 'LIC-102030',
    phone: '555-0100',
    email: 'lucia.rojas@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T08:00:00Z'),
    updatedAt: new Date('2026-01-01T08:00:00Z'),
  },
  {
    id: 'driver-2',
    firstName: 'Martin',
    lastName: 'Lopez',
    licenseNumber: 'LIC-200',
    phone: '555-0200',
    email: 'martin.lopez@example.com',
    status: 'SUSPENDED',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
  },
  {
    id: 'driver-3',
    firstName: 'Ana',
    lastName: 'Perez',
    licenseNumber: 'LIC-300',
    phone: '555-0300',
    email: 'ana.perez@example.com',
    status: 'INACTIVE',
    createdAt: new Date('2026-01-03T08:00:00Z'),
    updatedAt: new Date('2026-01-03T08:00:00Z'),
  },
];

describe('DriversListComponent search', () => {
  let fixture: ComponentFixture<DriversListComponent>;
  let nativeElement: HTMLElement;
  let currentDrivers: Driver[];

  beforeEach(async () => {
    currentDrivers = drivers.map((driver) => ({ ...driver }));

    await TestBed.configureTestingModule({
      imports: [DriversListComponent],
      providers: [
        provideRouter([]),
        {
          provide: DriversService,
          useValue: {
            getDrivers: () => of({ success: true, message: 'Drivers loaded.', data: currentDrivers }),
            updateDriverStatus: (id: string, status: DriverStatus) => {
              const updatedDriver = {
                ...currentDrivers.find((driver) => driver.id === id)!,
                status,
              };

              currentDrivers = currentDrivers.map((driver) =>
                driver.id === id ? updatedDriver : driver,
              );

              return of({
                success: true,
                message: 'Driver updated.',
                data: updatedDriver,
              });
            },
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

  it('shows all records after loading', () => {
    expect(renderedRows()).toBe(3);
  });

  it('filters while typing without blur and restores rows when the text is deleted', async () => {
    await enterSearch('lucia');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Luc\u00eda Rojas');

    await enterSearch('mart');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Martin Lopez');

    await enterSearch('lopez');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Martin Lopez');

    await enterSearch('');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('combines search and status filters', async () => {
    await enterSearch('martin');
    await setStatus('SUSPENDED');

    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Martin Lopez');

    await setStatus('ACTIVE');

    expect(renderedRows()).toBe(0);
  });

  it('clears all filters and works multiple times', async () => {
    await enterSearch('martin');
    await setStatus('SUSPENDED');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(fixture.componentInstance.filtersForm.getRawValue()).toEqual({
      search: '',
      status: '',
    });
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);

    await enterSearch('lucia');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('recalculates visible rows when a status changes under an active filter', async () => {
    await setStatus('ACTIVE');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Luc\u00eda Rojas');

    fixture.componentInstance.updateDriverStatus(currentDrivers[0], 'SUSPENDED');
    fixture.detectChanges();

    expect(renderedRows()).toBe(0);
    expect(nativeElement.textContent).not.toContain('Luc\u00eda Rojas');
  });

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#driversSearch');

    if (!input) {
      throw new Error('Expected drivers search input to exist.');
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
    const select = nativeElement.querySelector<HTMLSelectElement>('#driversStatusFilter');

    if (!select) {
      throw new Error('Expected drivers status filter to exist.');
    }

    return select;
  }

  async function setStatus(value: string): Promise<void> {
    const select = getStatusFilter();

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
