import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { Offer } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { BackLinkComponent } from '../../components/back-link/back-link.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink, OfferCardComponent, LoadingSpinnerComponent, BackLinkComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <app-back-link label="Back" fallbackLink="/" />
      <h1 class="section-title">Favourites</h1>
      <p class="section-sub">Offers you saved for later.</p>

      @if (loading) {
        <app-loading-spinner />
      } @else if (!offers.length) {
        <div class="surface-panel mt-8 text-center">
          <p class="font-display text-xl text-teal-900">No favourites yet</p>
          <p class="mt-2 text-sm text-[var(--color-muted)]">Tap the heart on any offer to save it here.</p>
          <a routerLink="/offers" class="btn-primary mt-4">Browse offers</a>
        </div>
      } @else {
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (offer of offers; track offer.id) {
            <app-offer-card [offer]="offer" (favoriteToggled)="reload()" />
          }
        </div>
      }
    </div>
  `,
})
export class FavoritesComponent implements OnInit {
  private readonly favorites = inject(FavoritesService);
  offers: Offer[] = [];
  loading = true;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.favorites.getFavorites().subscribe((offers) => {
      this.offers = offers;
      this.loading = false;
    });
  }
}
