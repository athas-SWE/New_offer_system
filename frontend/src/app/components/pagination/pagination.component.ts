import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageMeta } from '../../models/pagination.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (meta && meta.totalPages > 1) {
      <nav
        class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-teal-100 pt-5"
        aria-label="Pagination"
      >
        <p class="text-sm text-[var(--color-muted)]">
          Page {{ meta.page }} of {{ meta.totalPages }}
          <span class="hidden sm:inline"> · {{ meta.total }} total</span>
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn-secondary btn-compact"
            [disabled]="meta.page <= 1 || disabled"
            (click)="go(meta.page - 1)"
            aria-label="Previous page"
          >
            <mat-icon class="!text-base">chevron_left</mat-icon>
            Prev
          </button>

          @for (p of pages; track p) {
            @if (p === '…') {
              <span class="px-1 text-sm text-[var(--color-muted)]">…</span>
            } @else {
              <button
                type="button"
                class="btn-compact inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition"
                [class.border-teal-700]="p === meta.page"
                [class.bg-teal-700]="p === meta.page"
                [class.text-white]="p === meta.page"
                [class.border-teal-200]="p !== meta.page"
                [class.bg-white]="p !== meta.page"
                [class.text-teal-800]="p !== meta.page"
                [disabled]="disabled"
                (click)="go(+p)"
                [attr.aria-current]="p === meta.page ? 'page' : null"
              >
                {{ p }}
              </button>
            }
          }

          <button
            type="button"
            class="btn-secondary btn-compact"
            [disabled]="meta.page >= meta.totalPages || disabled"
            (click)="go(meta.page + 1)"
            aria-label="Next page"
          >
            Next
            <mat-icon class="!text-base">chevron_right</mat-icon>
          </button>
        </div>
      </nav>
    }
  `,
})
export class PaginationComponent {
  @Input() meta: PageMeta | null = null;
  @Input() disabled = false;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): Array<number | '…'> {
    const total = this.meta?.totalPages || 0;
    const current = this.meta?.page || 1;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const set = new Set<number>([1, total, current, current - 1, current + 1]);
    if (current <= 3) {
      set.add(2);
      set.add(3);
      set.add(4);
    }
    if (current >= total - 2) {
      set.add(total - 1);
      set.add(total - 2);
      set.add(total - 3);
    }
    const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const out: Array<number | '…'> = [];
    let prev = 0;
    for (const n of sorted) {
      if (prev && n - prev > 1) out.push('…');
      out.push(n);
      prev = n;
    }
    return out;
  }

  go(page: number): void {
    if (!this.meta || this.disabled) return;
    if (page < 1 || page > this.meta.totalPages || page === this.meta.page) return;
    this.pageChange.emit(page);
  }
}
