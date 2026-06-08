import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Trip, TripStatus } from '../../../core/models/trip.model';
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
    notes: 'Servicio matutino',
    createdAt: new Date('2026-01-01T08:00:00Z'),
    updatedAt: new Date('2026-01-01T08:00:00Z'),
    vehicle: {
      id: 'vehicle-1',
      unitNumber: 'ABC-123',
      brand: 'Volvo',
      model: 'B9R',
      year: 2024,
      capacity: 28,
      status: 'AVAILABLE',
    },
    driver: {
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
    route: {
      id: 'route-1',
      name: 'Centro - Aeropuerto',
      origin: 'Centro',
      destination: 'Aeropuerto',
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
    notes: 'Turno nocturno',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
    vehicle: {
      id: 'vehicle-2',
      unitNumber: 'DEF-456',
      brand: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      capacity: 18,
      status: 'MAINTENANCE',
    },
    driver: {
      id: 'driver-2',
      firstName: 'Martin',
      lastName: 'Lopez',
      licenseNumber: 'LIC-200',
      phone: '555-0200',
      email: 'martin.lopez@example.com',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-02T08:00:00Z'),
      updatedAt: new Date('2026-01-02T08:00:00Z'),
    },
    route: {
      id: 'route-2',
      name: 'Norte - Sur',
      origin: 'Norte',
      destination: 'Sur',
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
    notes: 'Ruta escolar',
    createdAt: new Date('2026-01-03T08:00:00Z'),
    updatedAt: new Date('2026-01-03T08:00:00Z'),
    vehicle: {
      id: 'vehicle-3',
      unitNumber: 'GHI-789',
      brand: 'Nissan',
      model: 'Urvan',
      year: 2022,
      capacity: 4,
      status: 'INACTIVE',
    },
    driver: {
      id: 'driver-3',
      firstName: 'Ana',
      lastName: 'Perez',
      licenseNumber: 'LIC-300',
      phone: '555-0300',
      email: 'ana.perez@example.com',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-03T08:00:00Z'),
      updatedAt: new Date('2026-01-03T08:00:00Z'),
    },
    route: {
      id: 'route-3',
      name: 'Circular Este',
      origin: 'Terminal Este',
      destination: 'Zona Industrial',
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
  let currentTrips: Trip[];

  beforeEach(async () => {
    currentTrips = trips.map((trip) => ({ ...trip }));

    await TestBed.configureTestingModule({
      imports: [TripsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: TripsService,
          useValue: {
            getTrips: () => of({ success: true, message: 'Trips loaded.', data: currentTrips }),
            updateTripStatus: (id: string, status: TripStatus) => {
              const updatedTrip = {
                ...currentTrips.find((trip) => trip.id === id)!,
                status,
              };

              currentTrips = currentTrips.map((trip) => (trip.id === id ? updatedTrip : trip));

              return of({
                success: true,
                message: 'Trip updated.',
                data: updatedTrip,
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

    fixture = TestBed.createComponent(TripsListComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows all records after loading', () => {
    expect(renderedRows()).toBe(3);
  });

  it('filters while typing without blur across vehicle, driver, route and notes', async () => {
    await enterSearch('abc');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('ABC-123');

    await enterSearch('lucia');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Luc\u00eda Rojas');

    await enterSearch('sur');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Norte - Sur');

    await enterSearch('nocturno');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Turno nocturno');

    await enterSearch('');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('combines search and status filters', async () => {
    await enterSearch('nocturno');
    await setStatus('IN_PROGRESS');

    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Turno nocturno');

    await setStatus('COMPLETED');

    expect(renderedRows()).toBe(0);
  });

  it('clears all filters and works multiple times', async () => {
    await enterSearch('nocturno');
    await setStatus('IN_PROGRESS');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(fixture.componentInstance.filtersForm.getRawValue()).toEqual({
      search: '',
      status: '',
    });
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);

    await enterSearch('abc');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('recalculates visible rows when a status changes under an active filter', async () => {
    await setStatus('SCHEDULED');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('ABC-123');

    fixture.componentInstance.updateTripStatus(currentTrips[0], 'IN_PROGRESS');
    fixture.detectChanges();

    expect(renderedRows()).toBe(0);
    expect(nativeElement.textContent).not.toContain('ABC-123');
  });

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#tripsSearch');

    if (!input) {
      throw new Error('Expected trips search input to exist.');
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
    const select = nativeElement.querySelector<HTMLSelectElement>('#tripsStatusFilter');

    if (!select) {
      throw new Error('Expected trips status filter to exist.');
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
