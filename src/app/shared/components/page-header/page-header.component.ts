import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserRole } from '../../../core/models/user.model';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, HasRoleDirective],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Input() actionLink: string | unknown[] | null = null;
  @Input() actionRoles: UserRole[] = [];
}
