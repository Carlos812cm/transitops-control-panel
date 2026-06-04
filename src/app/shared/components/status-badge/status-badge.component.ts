import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';

  get displayStatus(): string {
    return this.status.replaceAll('_', ' ');
  }

  get statusClass(): string {
    switch (this.status) {
      case 'AVAILABLE':
      case 'ACTIVE':
      case 'COMPLETED':
        return 'status-success';

      case 'MAINTENANCE':
      case 'SCHEDULED':
      case 'IN_PROGRESS':
        return 'status-warning';

      case 'SUSPENDED':
      case 'INACTIVE':
      case 'CANCELLED':
        return 'status-danger';

      default:
        return 'status-default';
    }
  }
}
