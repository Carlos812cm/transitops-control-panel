import { Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { LanguageService, TranslationKey } from '../../../core/services/language.service';
import { UserRole } from '../../../core/models/user.model';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, HasRoleDirective],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  private readonly languageService = inject(LanguageService);

  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() actionLink: string | unknown[] | null = null;
  @Input() actionRoles: UserRole[] = [];

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  get displayTitle(): string {
    return this.title || this.t('empty.defaultTitle');
  }

  get displayMessage(): string {
    return this.message || this.t('empty.defaultMessage');
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
