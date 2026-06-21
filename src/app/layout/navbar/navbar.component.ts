import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { User } from '../../core/models/user.model';
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
  private readonly router = inject(Router);

  @Input() isSidebarOpen = false;
  @Output() menuClicked = new EventEmitter<void>();

  readonly isProfileMenuOpen = signal(false);

  currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUser(),
  });

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  @HostListener('document:click')
  closeProfileMenuFromOutside(): void {
    this.isProfileMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeProfileMenuFromEscape(): void {
    this.isProfileMenuOpen.set(false);
  }

  openMenu(): void {
    this.menuClicked.emit();
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen.update((isOpen) => !isOpen);
  }

  keepProfileMenuOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  goToProfile(): void {
    this.isProfileMenuOpen.set(false);
    this.router.navigate(['/settings/profile']);
  }

  goToSettings(): void {
    this.isProfileMenuOpen.set(false);
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.isProfileMenuOpen.set(false);
    this.authService.logout();
  }

  getDisplayName(user: User): string {
    const structuredName = [user.firstName, user.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ');

    return structuredName || user.name || user.email;
  }

  getInitials(user: User): string {
    const source = this.getDisplayName(user);

    return source
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getAvatarUrl(user: User): string | null {
    return this.authService.getAvatarUrl(user.avatarUrl);
  }

  t(key: TranslationKey): string {
    this.currentLanguage();
    return this.languageService.translate(key);
  }
}
