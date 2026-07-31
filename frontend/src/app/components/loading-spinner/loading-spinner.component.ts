import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600"
        [style.width.px]="size"
        [style.height.px]="size"
      ></div>
      @if (label) {
        <p class="text-sm text-[var(--color-muted)]">{{ label }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading…';
  @Input() size = 40;
}
