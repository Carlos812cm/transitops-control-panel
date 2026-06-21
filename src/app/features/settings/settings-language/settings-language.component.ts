import { Component, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AppLanguage } from '../../../core/models/language.model';
import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type LanguageOption = {
  code: AppLanguage;
  labelKey: TranslationKey;
  nativeNameKey: TranslationKey;
  regionKey: TranslationKey;
  flag: string;
};

@Component({
  selector: 'app-settings-language',
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './settings-language.component.html',
  styleUrl: './settings-language.component.scss',
})
export class SettingsLanguageComponent {
  private readonly languageService = inject(LanguageService);

  readonly isLanguageMenuOpen = signal(false);

  readonly currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  readonly languageOptions: readonly LanguageOption[] = [
    {
      code: 'es',
      labelKey: 'settings.language.spanish',
      nativeNameKey: 'settings.language.spanishNative',
      regionKey: 'settings.language.spanishRegion',
      flag: 'ES',
    },
    {
      code: 'en',
      labelKey: 'settings.language.english',
      nativeNameKey: 'settings.language.englishNative',
      regionKey: 'settings.language.englishRegion',
      flag: 'EN',
    },
  ];

  @HostListener('document:click', ['$event'])
  closeMenuFromOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('[data-language-selector]')) {
      this.closeLanguageMenu();
    }
  }

  @HostListener('document:keydown.escape')
  closeLanguageMenuWithEscape(): void {
    this.closeLanguageMenu();
  }

  toggleLanguageMenu(): void {
    this.isLanguageMenuOpen.update((isOpen) => !isOpen);
  }

  closeLanguageMenu(): void {
    this.isLanguageMenuOpen.set(false);
  }

  selectLanguage(language: AppLanguage): void {
    this.languageService.setLanguage(language);
    this.closeLanguageMenu();
  }

  getCurrentLanguageOption(): LanguageOption {
    return (
      this.languageOptions.find((option) => option.code === this.currentLanguage()) ??
      this.languageOptions[0]
    );
  }

  isSelected(language: AppLanguage): boolean {
    return this.currentLanguage() === language;
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}