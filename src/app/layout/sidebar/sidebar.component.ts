import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HasRoleDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private readonly themeService = inject(ThemeService);

  @Input() isOpen = false;
  @Output() navItemClicked = new EventEmitter<void>();

  currentTheme = toSignal(this.themeService.currentTheme$, {
    initialValue: this.themeService.getCurrentTheme(),
  });

  closeOnNavigation(): void {
    this.navItemClicked.emit();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
