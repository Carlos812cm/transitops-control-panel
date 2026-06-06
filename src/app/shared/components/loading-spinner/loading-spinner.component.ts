import { Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { LanguageService, TranslationKey } from '../../../core/services/language.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
})
export class LoadingSpinnerComponent {
  private readonly languageService = inject(LanguageService);

  @Input() text = '';
  @Input() fullpage = false;

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  get displayText(): string {
    return this.text || this.t('common.loadingData');
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
