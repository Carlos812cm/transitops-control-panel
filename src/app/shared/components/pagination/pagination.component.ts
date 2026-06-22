import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PaginationMeta } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  @Input() meta: PaginationMeta | null | undefined = null;
  @Input() disabled = false;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  get currentPage(): number {
    return this.meta?.page ?? 1;
  }

  get currentLimit(): number {
    return this.meta?.limit ?? this.pageSizeOptions[0] ?? 10;
  }

  get total(): number {
    return this.meta?.total ?? 0;
  }

  get totalPages(): number {
    return this.meta?.totalPages ?? 0;
  }

  get firstItem(): number {
    if (!this.meta || this.total === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.currentLimit + 1;
  }

  get lastItem(): number {
    if (!this.meta || this.total === 0) {
      return 0;
    }

    return Math.min(this.currentPage * this.currentLimit, this.total);
  }

  get canGoPrevious(): boolean {
    return !this.disabled && Boolean(this.meta?.hasPreviousPage);
  }

  get canGoNext(): boolean {
    return !this.disabled && Boolean(this.meta?.hasNextPage);
  }

  goToPreviousPage(): void {
    if (!this.canGoPrevious) {
      return;
    }

    this.pageChange.emit(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (!this.canGoNext) {
      return;
    }

    this.pageChange.emit(this.currentPage + 1);
  }

  onLimitChange(event: Event): void {
    const limit = Number((event.target as HTMLSelectElement).value);

    if (!Number.isFinite(limit) || limit < 1 || limit === this.currentLimit) {
      return;
    }

    this.limitChange.emit(limit);
  }
}
