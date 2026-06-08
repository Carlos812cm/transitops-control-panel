import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Vehicle, VehicleStatus } from '../../../core/models/vehicle.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { VehiclesListComponent } from './vehicles-list.component';

const vehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    unitNumber: 'ABC-123',
    brand: 'Volvo',
    model: 'B9R',
    year: 2024,
    capacity: 28,
    status: 'AVAILABLE',
  },
  {
    id: 'vehicle-2',
    unitNumber: 'LIC-102030',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2023,
    capacity: 18,
    status: 'MAINTENANCE',
  },
  {
    id: 'vehicle-3',
    unitNumber: 'CAR-303',
    brand: 'Nissan',
    model: 'Versa',
    year: 2022,
    capacity: 4,
    status: 'INACTIVE',
  },
];

describe('VehiclesListComponent search', () => {
  let fixture: ComponentFixture<VehiclesListComponent>;
  let nativeElement: HTMLElement;
  let currentVehicles: Vehicle[];

  beforeEach(async () => {
    currentVehicles = vehicles.map((vehicle) => ({ ...vehicle }));

    await TestBed.configureTestingModule({
      imports: [VehiclesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: VehiclesService,
          useValue: {
            getVehicles: () =>
              of({ success: true, message: 'Vehicles loaded.', data: currentVehicles }),
            updateVehicleStatus: (id: string, status: VehicleStatus) => {
              const updatedVehicle = {
                ...currentVehicles.find((vehicle) => vehicle.id === id)!,
                status,
              };

              currentVehicles = currentVehicles.map((vehicle) =>
                vehicle.id === id ? updatedVehicle : vehicle,
              );

              return of({
                success: true,
                message: 'Vehicle updated.',
                data: updatedVehicle,
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

    fixture = TestBed.createComponent(VehiclesListComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows all records after loading', () => {
    expect(renderedRows()).toBe(3);
  });

  it('filters while typing without blur and restores rows when the text is deleted', async () => {
    await enterSearch('abc');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('ABC-123');
    expect(getClearButton().disabled).toBe(false);

    await enterSearch('vol');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Volvo');

    await enterSearch('');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('combines search and status filters', async () => {
    await enterSearch('vol');
    await setStatus('AVAILABLE');

    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('ABC-123');

    await setStatus('MAINTENANCE');

    expect(renderedRows()).toBe(0);
  });

  it('clears all filters and works multiple times', async () => {
    await enterSearch('mer');
    await setStatus('MAINTENANCE');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(fixture.componentInstance.filtersForm.getRawValue()).toEqual({
      search: '',
      status: '',
    });
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);

    await enterSearch('vol');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('recalculates visible rows when a status changes under an active filter', async () => {
    await setStatus('AVAILABLE');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('ABC-123');

    fixture.componentInstance.updateVehicleStatus(currentVehicles[0], 'MAINTENANCE');
    fixture.detectChanges();

    expect(renderedRows()).toBe(0);
    expect(nativeElement.textContent).not.toContain('ABC-123');
  });

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#vehiclesSearch');

    if (!input) {
      throw new Error('Expected vehicles search input to exist.');
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
    const select = nativeElement.querySelector<HTMLSelectElement>('#vehiclesStatusFilter');

    if (!select) {
      throw new Error('Expected vehicles status filter to exist.');
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
