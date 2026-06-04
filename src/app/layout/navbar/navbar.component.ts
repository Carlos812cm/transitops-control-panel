import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [AsyncPipe],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);

  @Input() isSidebarOpen = false;
  @Output() menuClicked = new EventEmitter<void>();

  currentUser$ = this.authService.currentUser$;
  private lastHeaderInteractionAt = 0;

  handleHeaderInteraction(event: Event): void {
    if (window.innerWidth > 992 || this.isSidebarOpen) {
      return;
    }

    const header = event.currentTarget as HTMLElement | null;

    if (!header) {
      return;
    }

    const pointer = this.getPointerPosition(event);

    if (!pointer) {
      return;
    }

    const { left, top } = header.getBoundingClientRect();
    const isInsideMenuZone = pointer.x <= left + 72 && pointer.y <= top + 72;

    if (!isInsideMenuZone) {
      return;
    }

    const now = Date.now();

    if (now - this.lastHeaderInteractionAt < 220) {
      return;
    }

    this.lastHeaderInteractionAt = now;
    this.openSidebar();
  }

  openSidebar(event?: Event): void {
    event?.stopPropagation();

    if (this.isSidebarOpen) {
      return;
    }

    this.menuClicked.emit();
  }

  private getPointerPosition(event: Event): { x: number; y: number } | null {
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    return null;
  }

  logout(): void {
    this.authService.logout();
  }
}
