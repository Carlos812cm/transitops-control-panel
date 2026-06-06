import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-home',
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss',
})
export class AdminHomeComponent {
  private readonly languageService = inject(LanguageService);

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
