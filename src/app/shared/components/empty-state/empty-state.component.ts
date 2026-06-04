import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserRole } from '../../../core/models/user.model';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, HasRoleDirective],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() title = 'No records found';
  @Input() message = 'There is no information to display yet.';
  @Input() actionLabel = '';
  @Input() actionLink: string | unknown[] | null = null;
  @Input() actionRoles: UserRole[] = [];
}
