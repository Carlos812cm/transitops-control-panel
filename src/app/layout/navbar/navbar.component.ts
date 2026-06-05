import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);

  @Input() isSidebarOpen = false;
  @Output() menuClicked = new EventEmitter<void>();

  currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUser(),
  });

  openMenu(): void {
    this.menuClicked.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
