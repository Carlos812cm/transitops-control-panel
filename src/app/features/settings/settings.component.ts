import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AppLanguage } from '../../core/models/language.model';
import { LanguageService, TranslationKey } from '../../core/services/language.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-settings',
  imports: [PageHeaderComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly languageService = inject(LanguageService);

  readonly currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  readonly languageOptions: readonly {
    code: AppLanguage;
    labelKey: TranslationKey;
  }[] = [
    {
      code: 'en',
      labelKey: 'settings.language.english',
    },
    {
      code: 'es',
      labelKey: 'settings.language.spanish',
    },
  ];

  setLanguage(language: AppLanguage): void {
    this.languageService.setLanguage(language);
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}

