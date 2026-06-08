import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Vehicle } from '../../../core/models/vehicle.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { VehiclesService } from '../../../core/services/vehicles.service';
import { VehiclesListComponent } from './vehicles-list.component';

const vehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    unitNumber: 'BUS-101',
    brand: 'Ford',
    model: 'Transit',
    year: 2024,
    capacity: 28,
    status: 'AVAILABLE',
  },
  {
    id: 'vehicle-2',
    unitNumber: 'VAN-202',
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: VehiclesService,
          useValue: {
            getVehicles: () => of({ success: true, message: 'Vehicles loaded.', data: vehicles }),
            updateVehicleStatus: () =>
              of({ success: true, message: 'Vehicle updated.', data: vehicles[0] }),
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

  it('updates the rendered rows while typing and deleting in the search input', () => {
    const input = getSearchInput();

    expect(renderedRows()).toBe(3);

    enterSearch(input, 'fo tr', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('BUS-101');
    expect(getClearButton().disabled).toBe(false);

    enterSearch(input, 'ord', 'input');
    expect(renderedRows()).toBe(0);
    expect(nativeElement.querySelector('app-empty-state')).not.toBeNull();

    enterSearch(input, 'mer', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('VAN-202');

    enterSearch(input, '', 'input');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('restores the table when the native search clear event or Clear button empties the input', () => {
    const input = getSearchInput();

    enterSearch(input, 'not-a-record', 'input');
    expect(renderedRows()).toBe(0);

    enterSearch(input, '', 'search');
    expect(renderedRows()).toBe(3);

    enterSearch(input, 'not-a-record', 'input');
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
    const input = nativeElement.querySelector<HTMLInputElement>('#vehiclesSearch');

    if (!input) {
      throw new Error('Expected vehicles search input to exist.');
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
