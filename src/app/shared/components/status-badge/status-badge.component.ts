import { Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';

import { LanguageService, TranslationKey } from '../../../core/services/language.service';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  private readonly languageService = inject(LanguageService);

  @Input({ required: true }) status = '';

  currentLanguage = toSignal(this.languageService.currentLanguage$, {
    initialValue: this.languageService.getCurrentLanguage(),
  });

  get displayStatus(): string {
    this.currentLanguage();

    const key = this.statusTranslationKeys[this.status];

    if (key) {
      return this.languageService.translate(key);
    }

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

  private readonly statusTranslationKeys: Record<string, TranslationKey> = {
    AVAILABLE: 'status.available',
    MAINTENANCE: 'status.maintenance',
    INACTIVE: 'status.inactive',
    ACTIVE: 'status.active',
    SUSPENDED: 'status.suspended',
    SCHEDULED: 'status.scheduled',
    IN_PROGRESS: 'status.inProgress',
    COMPLETED: 'status.completed',
    CANCELLED: 'status.cancelled',
  };
}
