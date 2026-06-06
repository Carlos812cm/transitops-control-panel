import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';
import { LanguageService, TranslationKey } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);

  @Input() isSidebarOpen = false;
  @Output() menuClicked = new EventEmitter<void>();

  currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUser(),
  });

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  openMenu(): void {
    this.menuClicked.emit();
  }

  logout(): void {
    this.authService.logout();
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
