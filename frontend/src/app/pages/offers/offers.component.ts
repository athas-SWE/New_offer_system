import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OffersService } from '../../services/offers.service';
import { CategoriesService } from '../../services/categories.service';
import { Category, Offer, OfferFilter } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [FormsModule, RouterLink, OfferCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">All offers</h1>
      <p class="section-sub">Search and filter deals from shops across Sri Lanka.</p>

      <div class="mt-8 grid gap-3 rounded-2xl border border-teal-100 bg-white/90 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input class="input-field" [(ngModel)]="filter.search" (ngModelChange)="apply()" placeholder="Search offers, shops, cities…" />
        <select class="input-field" [(ngModel)]="filter.categoryId" (ngModelChange)="apply()">
          <option value="">All categories</option>
          @for (cat of categories; track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <select class="input-field" [(ngModel)]="filter.city" (ngModelChange)="apply()">
          <option value="">All cities</option>
          @for (city of cities; track city) {
            <option [value]="city">{{ city }}</option>
          }
        </select>
        <select class="input-field" [(ngModel)]="minDiscount" (ngModelChange)="onDiscountChange()">
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
          <a routerLink="/offers" class="btn-primary mt-4" (click)="reset()">Reset filters</a>
        </div>
      } @else {
        <p class="mt-6 text-sm text-[var(--color-muted)]">{{ offers.length }} offers found</p>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (offer of offers; track offer.id) {
            <app-offer-card [offer]="offer" />
          }
        </div>
      }
    </div>
  `,
})
export class OffersComponent implements OnInit {
  private readonly offersService = inject(OffersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly route = inject(ActivatedRoute);

  offers: Offer[] = [];
  categories: Category[] = [];
  cities = ['Colombo', 'Kandy', 'Negombo', 'Nuwara Eliya', 'Galle'];
  loading = true;
  minDiscount = 0;
  filter: OfferFilter = { search: '', categoryId: '', city: '' };

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe((cats) => (this.categories = cats));
    this.route.queryParamMap.subscribe((params) => {
      this.filter.categoryId = params.get('categoryId') || '';
      this.filter.search = params.get('q') || '';
      this.apply();
    });
  }

  apply(): void {
    this.loading = true;
    this.offersService.getOffers({ ...this.filter, minDiscount: this.minDiscount || undefined }).subscribe((offers) => {
      this.offers = offers;
      this.loading = false;
    });
  }

  onDiscountChange(): void {
    this.apply();
  }

  reset(): void {
    this.filter = { search: '', categoryId: '', city: '' };
    this.minDiscount = 0;
    this.apply();
  }
}
