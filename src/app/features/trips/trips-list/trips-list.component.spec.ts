import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Trip } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TripsService } from '../../../core/services/trips.service';
import { TripsListComponent } from './trips-list.component';

const trips: Trip[] = [
  {
    id: 'trip-1',
    vehicleId: 'vehicle-1',
    driverId: 'driver-1',
    routeId: 'route-1',
    scheduledDeparture: new Date('2026-01-01T08:00:00Z'),
    status: 'SCHEDULED',
    notes: 'Morning service',
    createdAt: new Date('2026-01-01T08:00:00Z'),
    updatedAt: new Date('2026-01-01T08:00:00Z'),
    vehicle: {
      id: 'vehicle-1',
      unitNumber: 'BUS-101',
      brand: 'Ford',
      model: 'Transit',
      year: 2024,
      capacity: 28,
      status: 'AVAILABLE',
    },
    driver: {
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
    route: {
      id: 'route-1',
      name: 'Ruta Norte',
      origin: 'Terminal Central',
      destination: 'Parque Industrial',
      distanceKm: 18,
      estimatedDurationMinutes: 45,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T08:00:00Z'),
      updatedAt: new Date('2026-01-01T08:00:00Z'),
    },
  },
  {
    id: 'trip-2',
    vehicleId: 'vehicle-2',
    driverId: 'driver-2',
    routeId: 'route-2',
    scheduledDeparture: new Date('2026-01-02T08:00:00Z'),
    status: 'IN_PROGRESS',
    notes: 'Campus run',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
    vehicle: {
      id: 'vehicle-2',
      unitNumber: 'VAN-202',
      brand: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      capacity: 18,
      status: 'MAINTENANCE',
    },
    driver: {
      id: 'driver-2',
      firstName: 'Marta',
      lastName: 'Lopez',
      licenseNumber: 'LIC-200',
      phone: '555-0200',
      email: 'marta.lopez@example.com',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-02T08:00:00Z'),
      updatedAt: new Date('2026-01-02T08:00:00Z'),
    },
    route: {
      id: 'route-2',
      name: 'Circuito Sur',
      origin: 'Centro Historico',
      destination: 'Universidad',
      distanceKm: 12,
      estimatedDurationMinutes: 35,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-02T08:00:00Z'),
      updatedAt: new Date('2026-01-02T08:00:00Z'),
    },
  },
  {
    id: 'trip-3',
    vehicleId: 'vehicle-3',
    driverId: 'driver-3',
    routeId: 'route-3',
    scheduledDeparture: new Date('2026-01-03T08:00:00Z'),
    status: 'COMPLETED',
    notes: 'Airport transfer',
    createdAt: new Date('2026-01-03T08:00:00Z'),
    updatedAt: new Date('2026-01-03T08:00:00Z'),
    vehicle: {
      id: 'vehicle-3',
      unitNumber: 'CAR-303',
      brand: 'Nissan',
      model: 'Versa',
      year: 2022,
      capacity: 4,
      status: 'INACTIVE',
    },
    driver: {
      id: 'driver-3',
      firstName: 'Diego',
      lastName: 'Santos',
      licenseNumber: 'LIC-300',
      phone: '555-0300',
      email: 'diego.santos@example.com',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-03T08:00:00Z'),
      updatedAt: new Date('2026-01-03T08:00:00Z'),
    },
    route: {
      id: 'route-3',
      name: 'Expreso Este',
      origin: 'Aeropuerto',
      destination: 'Zona Hotelera',
      distanceKm: 24,
      estimatedDurationMinutes: 55,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-03T08:00:00Z'),
      updatedAt: new Date('2026-01-03T08:00:00Z'),
    },
  },
];

describe('TripsListComponent search', () => {
  let fixture: ComponentFixture<TripsListComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: TripsService,
          useValue: {
            getTrips: () => of({ success: true, message: 'Trips loaded.', data: trips }),
            updateTripStatus: () => of({ success: true, message: 'Trip updated.', data: trips[0] }),
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

    fixture = TestBed.createComponent(TripsListComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('updates the rendered rows while typing and deleting in the search input', () => {
    const input = getSearchInput();

    expect(renderedRows()).toBe(3);

    enterSearch(input, 'bus10', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('BUS-101');
    expect(getClearButton().disabled).toBe(false);

    enterSearch(input, 'us10', 'input');
    expect(renderedRows()).toBe(0);
    expect(nativeElement.querySelector('app-empty-state')).not.toBeNull();

    enterSearch(input, 'van20', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('VAN-202');

    enterSearch(input, '', 'input');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('restores the table when the native search clear event or Clear button empties the input', () => {
    const input = getSearchInput();

    enterSearch(input, 'not-a-trip', 'input');
    expect(renderedRows()).toBe(0);

    enterSearch(input, '', 'search');
    expect(renderedRows()).toBe(3);

    enterSearch(input, 'not-a-trip', 'input');
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
    const input = nativeElement.querySelector<HTMLInputElement>('#tripsSearch');

    if (!input) {
      throw new Error('Expected trips search input to exist.');
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
