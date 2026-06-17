import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserRole } from '../../core/models/user.model';
import { LanguageService, TranslationKey } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { themeLabel as label } from './sidebar.component.next';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HasRoleDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: [
    './sidebar.component.scss',
    './sidebar-theme-toggle.scss',
    './sidebar-theme-toggle-overrides.css',
  ],
})
export class SidebarComponent {
  private l = inject(LanguageService);
  private s = inject(ThemeService);

  @Input()
  isOpen = false;

  @Output()
  navItemClicked = new EventEmitter<void>();

  settingsRoles: UserRole[] = ['ADMIN', 'OPERATOR', 'SUPERVISOR', 'VIEWER'];

  currentLanguage = toSignal(this.l.currentLanguage$, {
    initialValue: this.l.getCurrentLanguage(),
  });

  currentTheme = toSignal(this.s.currentTheme$, {
    initialValue: this.s.getCurrentTheme(),
  });

  closeOnNavigation(): void {
    this.navItemClicked.emit();
  }

  toggleTheme(): void {
    this.s.toggleTheme();
  }

  themeLabel(t: 'light' | 'dark'): string {
    return label(this.currentLanguage(), t);
  }

  t(k: TranslationKey): string {
    this.currentLanguage();
    return this.l.translate(k);
  }
}