import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AppLanguage } from '../models/language.model';

export const languageTranslations = {
  en: {
    'sidebar.brand.subtitle': 'Control Panel',
    'sidebar.close': 'Close sidebar',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.vehicles': 'Vehicles',
    'sidebar.drivers': 'Drivers',
    'sidebar.routes': 'Routes',
    'sidebar.trips': 'Trips',
    'sidebar.admin': 'Admin',
    'sidebar.settings': 'Settings',
    'sidebar.theme.light': 'Light mode',
    'sidebar.theme.dark': 'Dark mode',
    'sidebar.theme.switchToLight': 'Switch to light theme',
    'sidebar.theme.switchToDark': 'Switch to dark theme',
    'sidebar.meta.project': 'TransitOps Platform',
    'sidebar.meta.description': 'Angular Admin System',
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage personal workspace preferences for TransitOps.',
    'settings.language.title': 'Language',
    'settings.language.description': 'Choose the display language for navigation and settings.',
    'settings.language.english': 'English',
    'settings.language.spanish': 'Spanish',
    'settings.language.current': 'Current language',
  },
  es: {
    'sidebar.brand.subtitle': 'Panel de control',
    'sidebar.close': 'Cerrar menú lateral',
    'sidebar.dashboard': 'Panel',
    'sidebar.vehicles': 'Vehículos',
    'sidebar.drivers': 'Conductores',
    'sidebar.routes': 'Rutas',
    'sidebar.trips': 'Viajes',
    'sidebar.admin': 'Administración',
    'sidebar.settings': 'Configuración',
    'sidebar.theme.light': 'Modo claro',
    'sidebar.theme.dark': 'Modo oscuro',
    'sidebar.theme.switchToLight': 'Cambiar a tema claro',
    'sidebar.theme.switchToDark': 'Cambiar a tema oscuro',
    'sidebar.meta.project': 'Plataforma TransitOps',
    'sidebar.meta.description': 'Sistema administrativo Angular',
    'settings.title': 'Configuración',
    'settings.subtitle': 'Administra tus preferencias personales de TransitOps.',
    'settings.language.title': 'Idioma',
    'settings.language.description': 'Elige el idioma de navegación y configuración.',
    'settings.language.english': 'Inglés',
    'settings.language.spanish': 'Español',
    'settings.language.current': 'Idioma actual',
  },
} as const;

export type TranslationKey = keyof (typeof languageTranslations)['en'];

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly languageKey = 'transitops_language';

  private readonly currentLanguageSubject = new BehaviorSubject<AppLanguage>(
    this.getInitialLanguage(),
  );

  readonly currentLanguage$ = this.currentLanguageSubject.asObservable();
  readonly supportedLanguages: readonly AppLanguage[] = ['en', 'es'];

  constructor() {
    this.applyLanguage(this.currentLanguageSubject.value);
  }

  getCurrentLanguage(): AppLanguage {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: AppLanguage): void {
    if (this.isBrowser) {
      localStorage.setItem(this.languageKey, language);
    }

    this.currentLanguageSubject.next(language);
    this.applyLanguage(language);
  }

  translate(key: TranslationKey): string {
    return languageTranslations[this.currentLanguageSubject.value][key];
  }

  private getInitialLanguage(): AppLanguage {
    if (!this.isBrowser) {
      return 'en';
    }

    const storedLanguage = localStorage.getItem(this.languageKey);

    if (this.isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }

    return 'en';
  }

  private isSupportedLanguage(language: string | null): language is AppLanguage {
    return language === 'en' || language === 'es';
  }

  private applyLanguage(language: AppLanguage): void {
    this.document.documentElement.setAttribute('lang', language);
  }
}
