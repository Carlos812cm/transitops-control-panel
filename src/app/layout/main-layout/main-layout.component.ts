import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);

  isSidebarOpen = signal(false);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.authService.getProfile().subscribe({
      error: () => {
        this.authService.logout();
      },
    });
  }

  openSidebar(): void {
    this.isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
