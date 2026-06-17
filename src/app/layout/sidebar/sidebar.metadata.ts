import { RouterLink, RouterLinkActive } from '@angular/router';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

export const sidebarMetadata = {
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HasRoleDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss', './sidebar-theme-toggle.scss'],
};
