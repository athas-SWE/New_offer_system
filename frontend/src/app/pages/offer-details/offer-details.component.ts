import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OffersService } from '../../services/offers.service';
import { FavoritesService } from '../../services/favorites.service';
import { SeoService } from '../../services/seo.service';
import { Offer } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { BackLinkComponent } from '../../components/back-link/back-link.component';
import { formatDate, formatLkr } from '../../shared/utils';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, MatIconModule, BackLinkComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <app-back-link label="Back to offers" fallbackLink="/offers" />
      @if (loading) {
        <app-loading-spinner />
      } @else if (!offer) {
        <div class="surface-panel text-center">
          <p class="font-display text-2xl text-teal-900">Offer not found</p>
          <a routerLink="/offers" class="btn-primary mt-4">Back to offers</a>
        </div>
      } @else {
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="overflow-hidden rounded-3xl">
            <img [src]="offer.imageUrl" [alt]="offer.title" class="h-full min-h-[320px] w-full object-cover" />
          </div>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              {{ offer.categoryName }} · {{ offer.city }}
            </p>
            <h1 class="mt-2 font-display text-2xl font-semibold text-teal-900 sm:text-3xl md:text-4xl">
              {{ offer.title }}
            </h1>
            <p class="mt-4 text-[var(--color-muted)]">{{ offer.description }}</p>

            <div class="mt-6 flex flex-wrap items-end gap-3">
              @if (offer.offerPrice > 0) {
                <span class="text-3xl font-bold text-teal-800">{{ price(offer.offerPrice) }}</span>
                @if (offer.originalPrice > 0) {
                  <span class="text-lg text-[var(--color-muted)] line-through">{{ price(offer.originalPrice) }}</span>
                }
              }
              <span class="rounded-full bg-gold-500 px-3 py-1 text-sm font-bold text-white"
                >-{{ offer.discountPercent }}%</span
              >
            </div>

            <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div class="surface-panel !p-3">
                <dt class="text-[var(--color-muted)]">Shop</dt>
                <dd class="mt-1 font-semibold text-teal-900">
                  <a [routerLink]="['/shops', offer.storeId]" class="hover:underline">{{ offer.storeName }}</a>
                </dd>
              </div>
              <div class="surface-panel !p-3">
                <dt class="text-[var(--color-muted)]">Valid until</dt>
                <dd class="mt-1 font-semibold text-teal-900">{{ date(offer.endsAt) }}</dd>
              </div>
            </dl>

            <div class="surface-panel mt-4 !p-4">
              <p class="text-sm font-semibold text-teal-900">How to redeem</p>
              <p class="mt-1 text-sm text-[var(--color-muted)]">
                Show this offer at the shop (or mention Offer Lanka) before paying. Confirm the discount and valid dates
                with the staff.
              </p>
            </div>

            @if (offer.tags?.length) {
              <div class="mt-4 flex flex-wrap gap-2">
                @for (tag of offer.tags; track tag) {
                  <span class="chip">{{ tag }}</span>
                }
              </div>
            }

            <div class="mt-8 flex flex-wrap gap-3">
              <button type="button" class="btn-primary" (click)="toggleFavorite()">
                <mat-icon class="!text-base">{{ favorited ? 'favorite' : 'favorite_border' }}</mat-icon>
                {{ favorited ? 'Saved' : 'Save offer' }}
              </button>
              <button type="button" class="btn-secondary" (click)="shareOffer()">
                <mat-icon class="!text-base">share</mat-icon>
                Share
              </button>
              @if (callLink) {
                <a [href]="callLink" class="btn-secondary">
                  <mat-icon class="!text-base">call</mat-icon>
                  Call shop
                </a>
              }
              @if (directionsLink) {
                <a [href]="directionsLink" target="_blank" rel="noopener" class="btn-secondary">
                  <mat-icon class="!text-base">directions</mat-icon>
                  Directions
                </a>
              }
              @if (offer.storeId) {
                <a [routerLink]="['/shops', offer.storeId]" class="btn-secondary">View shop</a>
              }
              <a routerLink="/offers" class="btn-secondary">Browse more</a>
            </div>

            @if (actionMessage) {
              <p class="mt-3 text-sm font-medium text-teal-700">{{ actionMessage }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class OfferDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly offersService = inject(OffersService);
  private readonly favorites = inject(FavoritesService);
  private readonly seo = inject(SeoService);

  offer?: Offer;
  loading = true;
  actionMessage = '';

  get favorited(): boolean {
    return !!this.offer && this.favorites.isFavorite(this.offer.id);
  }

  get callLink(): string | null {
    const phone = this.offer?.storePhone?.replace(/\s+/g, '');
    return phone ? `tel:${phone}` : null;
  }

  get directionsLink(): string | null {
    if (!this.offer) return null;
    if (this.offer.locationUrl) return this.offer.locationUrl;
    if (this.offer.latitude != null && this.offer.longitude != null) {
      return `https://www.google.com/maps?q=${this.offer.latitude},${this.offer.longitude}`;
    }
    return null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.offersService.getOfferById(id).subscribe((offer) => {
      this.offer = offer;
      this.loading = false;
      this.applySeo(offer, id);
    });
  }

  toggleFavorite(): void {
    if (!this.offer) return;
    this.favorites.toggle(this.offer).subscribe((isFavorite) => {
      this.actionMessage = isFavorite ? 'Saved to favourites.' : 'Removed from favourites.';
    });
  }

  async shareOffer(): Promise<void> {
    if (!this.offer) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = this.offer.title;
    const text = `${this.offer.title} — ${this.offer.discountPercent}% off at ${this.offer.storeName || 'Offer Lanka'}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        this.actionMessage = 'Thanks for sharing!';
        return;
      }
    } catch {
      // User cancelled share sheet — ignore.
    }

    try {
      await navigator.clipboard.writeText(url);
      this.actionMessage = 'Link copied — share it with friends.';
    } catch {
      this.actionMessage = 'Copy this page link from your browser to share.';
    }
  }

  private applySeo(offer: Offer | undefined, id: string): void {
    if (!offer) {
      this.seo.update({
        title: 'Offer not found',
        description: 'This offer is unavailable or has expired on Offer Lanka.',
        path: `/offers/${id}`,
        noIndex: true,
      });
      return;
    }

    const location = [offer.storeName, offer.city].filter(Boolean).join(' in ');
    this.seo.update({
      title: `${offer.title}${offer.discountPercent ? ` — ${offer.discountPercent}% off` : ''}`,
      description:
        offer.description ||
        `${offer.title}${location ? ` from ${location}` : ''} on Offer Lanka.`,
      image: offer.imageUrl,
      path: `/offers/${offer.id}`,
      type: 'product',
      keywords: [offer.title, offer.categoryName, offer.city, offer.storeName, 'offer', 'deal']
        .filter(Boolean)
        .join(', '),
      jsonLd: this.seo.offerJsonLd(offer),
    });
  }

  price(amount: number): string {
    return formatLkr(amount);
  }

  date(value: string): string {
    return formatDate(value);
  }
}
