import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TransitRoute } from '../../../core/models/route.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { RoutesService } from '../../../core/services/routes.service';
import { RoutesListComponent } from './routes-list.component';

const routes: TransitRoute[] = [
  {
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
  {
    id: 'route-2',
    name: 'Circuito Sur',
    origin: 'Centro Historico',
    destination: 'Universidad',
    distanceKm: 12,
    estimatedDurationMinutes: 35,
    status: 'INACTIVE',
    createdAt: new Date('2026-01-02T08:00:00Z'),
    updatedAt: new Date('2026-01-02T08:00:00Z'),
  },
  {
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
];

describe('RoutesListComponent search', () => {
  let fixture: ComponentFixture<RoutesListComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesListComponent],
      providers: [
        provideRouter([]),
        {
          provide: RoutesService,
          useValue: {
            getRoutes: () => of({ success: true, message: 'Routes loaded.', data: routes }),
            updateRouteStatus: () =>
              of({ success: true, message: 'Route updated.', data: routes[0] }),
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

  it('updates the rendered rows while typing and deleting in the search input', () => {
    const input = getSearchInput();

    expect(renderedRows()).toBe(3);

    enterSearch(input, 'rut nor', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Ruta Norte');
    expect(getClearButton().disabled).toBe(false);

    enterSearch(input, 'orte', 'input');
    expect(renderedRows()).toBe(0);
    expect(nativeElement.querySelector('app-empty-state')).not.toBeNull();

    enterSearch(input, 'cir sur', 'input');
    expect(renderedRows()).toBe(1);
    expect(nativeElement.textContent).toContain('Circuito Sur');

    enterSearch(input, '', 'input');
    expect(renderedRows()).toBe(3);
    expect(getClearButton().disabled).toBe(true);
  });

  it('restores the table when the native search clear event or Clear button empties the input', () => {
    const input = getSearchInput();

    enterSearch(input, 'not-a-route', 'input');
    expect(renderedRows()).toBe(0);

    enterSearch(input, '', 'search');
    expect(renderedRows()).toBe(3);

    enterSearch(input, 'not-a-route', 'input');
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
    const input = nativeElement.querySelector<HTMLInputElement>('#routesSearch');

    if (!input) {
      throw new Error('Expected routes search input to exist.');
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
