import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { LanguageService, TranslationKey } from '../../../core/services/language.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
})
export class AccessDeniedComponent {
  private readonly languageService = inject(LanguageService);

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
