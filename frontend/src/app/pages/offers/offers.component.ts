import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OffersService } from '../../services/offers.service';
import { CategoriesService } from '../../services/categories.service';
import { City, LocationsService } from '../../services/locations.service';
import { Category, Offer, OfferFilter, PageMeta } from '../../models';
import { emptyPageMeta } from '../../models/pagination.model';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    OfferCardComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
  ],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">All offers</h1>
      <p class="section-sub">Search and filter deals from shops across Sri Lanka.</p>

      <div class="mt-8 grid gap-3 rounded-2xl border border-teal-100 bg-white/90 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input
          class="input-field"
          [(ngModel)]="filter.search"
          (ngModelChange)="onFilterChange()"
          placeholder="Search offers, shops, cities…"
        />
        <select class="input-field" [(ngModel)]="filter.categoryId" (ngModelChange)="onFilterChange()">
          <option value="">All categories</option>
          @for (cat of categories; track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <select class="input-field" [(ngModel)]="filter.cityId" (ngModelChange)="onFilterChange()">
          <option value="">All cities</option>
          @for (city of cities; track city.id) {
            <option [value]="city.id">{{ cityLabel(city) }}</option>
          }
        </select>
        <select class="input-field" [(ngModel)]="minDiscount" (ngModelChange)="onFilterChange()">
          <option [ngValue]="0">Any discount</option>
          <option [ngValue]="20">20%+</option>
          <option [ngValue]="30">30%+</option>
          <option [ngValue]="40">40%+</option>
        </select>
      </div>

      @if (loading) {
        <app-loading-spinner label="Loading offers…" />
      } @else if (!offers.length) {
        <div class="surface-panel mt-10 text-center">
          <p class="font-display text-xl text-teal-900">No offers match your filters</p>
          <p class="mt-2 text-sm text-[var(--color-muted)]">Try a different city or category.</p>
          <button type="button" class="btn-primary mt-4" (click)="reset()">Reset filters</button>
        </div>
      } @else {
        <p class="mt-6 text-sm text-[var(--color-muted)]">{{ pageMeta.total }} offers found</p>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (offer of offers; track offer.id) {
            <app-offer-card [offer]="offer" />
          }
        </div>
        <app-pagination [meta]="pageMeta" [disabled]="loading" (pageChange)="goToPage($event)" />
      }
    </div>
  `,
})
export class OffersComponent implements OnInit {
  private readonly offersService = inject(OffersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly locations = inject(LocationsService);
  private readonly route = inject(ActivatedRoute);

  offers: Offer[] = [];
  categories: Category[] = [];
  cities: City[] = [];
  loading = true;
  minDiscount = 0;
  pageMeta: PageMeta = emptyPageMeta(1, 12);
  filter: OfferFilter = { search: '', categoryId: '', cityId: '' };
  private readonly pageSize = 12;

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe((cats) => (this.categories = cats));
    this.locations.getCities().subscribe((cities) => (this.cities = cities));
    this.route.queryParamMap.subscribe((params) => {
      this.filter.categoryId = params.get('categoryId') || '';
      this.filter.search = params.get('q') || '';
      this.filter.cityId = params.get('cityId') || this.filter.cityId || '';
      this.pageMeta = { ...this.pageMeta, page: 1 };
      this.apply();
    });
  }

  cityLabel(city: City): string {
    const district = city.district?.name;
    return district ? `${city.name} — ${district}` : city.name;
  }

  onFilterChange(): void {
    this.pageMeta = { ...this.pageMeta, page: 1 };
    this.apply();
  }

  goToPage(page: number): void {
    this.pageMeta = { ...this.pageMeta, page };
    this.apply();
  }

  apply(): void {
    this.loading = true;
    this.offersService
      .getOffersPage({
        ...this.filter,
        minDiscount: this.minDiscount || undefined,
        page: this.pageMeta.page,
        limit: this.pageSize,
      })
      .subscribe((res) => {
        this.offers = res.items;
        this.pageMeta = res.meta;
        this.loading = false;
      });
  }

  reset(): void {
    this.filter = { search: '', categoryId: '', cityId: '' };
    this.minDiscount = 0;
    this.pageMeta = emptyPageMeta(1, this.pageSize);
    this.apply();
  }
}
