import { Component, Input, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * History-aware back control for detail / secondary pages.
 * Uses browser history when available; otherwise navigates to fallbackLink.
 */
@Component({
  selector: 'app-back-link',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <div class="mb-4">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 hover:text-teal-950"
        (click)="goBack()"
      >
        <mat-icon class="!text-lg">arrow_back</mat-icon>
        <span>{{ label }}</span>
      </button>
      @if (fallbackLink && fallbackLink.length) {
        <!-- Keep a real link for crawlers / middle-click; visually hidden from layout flow -->
        <a [routerLink]="fallbackLink" class="sr-only">{{ label }}</a>
      }
    </div>
  `,
})
export class BackLinkComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  /** Button label, e.g. "Back to offers" */
  @Input() label = 'Back';

  /** Fallback route when there is no in-app history (direct open / refresh). */
  @Input() fallbackLink: string | string[] = '/';

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    const link = this.fallbackLink;
    void this.router.navigate(Array.isArray(link) ? link : [link]);
  }
}
