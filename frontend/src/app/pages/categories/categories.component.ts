import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Categories</h1>
      <p class="section-sub">Browse deals by what you're looking for.</p>

      @if (loading) {
        <app-loading-spinner />
      } @else {
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (cat of categories; track cat.id) {
            <a
              [routerLink]="['/offers']"
              [queryParams]="{ categoryId: cat.id }"
              class="surface-panel group relative overflow-hidden transition hover:-translate-y-1 hover:shadow-lift"
            >
              <div class="absolute inset-y-0 left-0 w-1.5" [style.background]="cat.color || '#0d9488'"></div>
              <div class="flex items-start gap-4 pl-2">
                <span
                  class="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                  [style.background]="cat.color || '#0d9488'"
                >
                  <mat-icon>{{ cat.icon }}</mat-icon>
                </span>
                <div>
                  <h2 class="font-display text-xl font-semibold text-teal-900">{{ cat.name }}</h2>
                  <p class="mt-1 text-sm text-[var(--color-muted)]">{{ cat.description }}</p>
                  <p class="mt-3 text-xs font-semibold text-teal-700">{{ cat.offerCount }} live offers →</p>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class CategoriesComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  categories: Category[] = [];
  loading = true;

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe((cats) => {
      this.categories = cats;
      this.loading = false;
    });
  }
}
