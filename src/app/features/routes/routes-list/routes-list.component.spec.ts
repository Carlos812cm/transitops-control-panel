import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RouteStatus, TransitRoute } from '../../../core/models/route.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { RoutesService } from '../../../core/services/routes.service';
import { RoutesListComponent } from './routes-list.component';

const routes: TransitRoute[] = [
  {
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
  {
    id: 'route-2',
    name: 'Norte - Sur',
    origin: 'Norte',
    destination: 'Sur',
    distanceKm: 12,
    estimatedDurationMinutes: 35,
    status: 'INACTIVE',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
  },
  {
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
];

describe('RoutesListComponent search', () => {
  let fixture: ComponentFixture<RoutesListComponent>;
  let nativeElement: HTMLElement;
  let currentRoutes: TransitRoute[];

  beforeEach(async () => {
    currentRoutes = routes.map((route) => ({ ...route }));

    await TestBed.configureTestingModule({
      imports: [RoutesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: RoutesService,
          useValue: {
            getRoutes: () => of({ success: true, message: 'Routes loaded.', data: currentRoutes }),
            updateRouteStatus: (id: string, status: RouteStatus) => {
              const updatedRoute = {
                ...currentRoutes.find((route) => route.id === id)!,
                status,
              };

              currentRoutes = currentRoutes.map((route) =>
                route.id === id ? updatedRoute : route,
              );

              return of({
                success: true,
                message: 'Route updated.',
                data: updatedRoute,
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

    fixture = TestBed.createComponent(RoutesListComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows all records after loading', () => {
    expect(renderedRows()).toBe(3);
  });

  it('filters while typing without blur and restores rows when the text is deleted', async () => {
    await enterSearch('centro');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Centro - Aeropuerto');

    await enterSearch('sur');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Norte - Sur');

    await enterSearch('');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('combines search and status filters', async () => {
    await enterSearch('sur');
    await setStatus('INACTIVE');

    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Norte - Sur');

    await setStatus('ACTIVE');

    expect(renderedRows()).toBe(0);
  });

  it('clears all filters and works multiple times', async () => {
    await enterSearch('sur');
    await setStatus('INACTIVE');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(fixture.componentInstance.filtersForm.getRawValue()).toEqual({
      search: '',
      status: '',
    });
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);

    await enterSearch('centro');
    expect(renderedRows()).toBe(1);

    await clickClear();
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('recalculates visible rows when a status changes under an active filter', async () => {
    await setStatus('ACTIVE');
    expect(renderedRows()).toBe(2);

    fixture.componentInstance.updateRouteStatus(currentRoutes[0], 'INACTIVE');
    fixture.detectChanges();

    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).not.toContain('Centro - Aeropuerto');
  });

  function getSearchInput(): HTMLInputElement {
    const input = nativeElement.querySelector<HTMLInputElement>('#routesSearch');

    if (!input) {
      throw new Error('Expected routes search input to exist.');
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
    const select = nativeElement.querySelector<HTMLSelectElement>('#routesStatusFilter');

    if (!select) {
      throw new Error('Expected routes status filter to exist.');
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
