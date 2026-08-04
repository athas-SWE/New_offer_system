import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OffersService } from '../../services/offers.service';
import { HeroSlidesService } from '../../services/hero-slides.service';
import { HeroSlide } from '../../services/admin.service';
import { Offer } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, OfferCardComponent, LoadingSpinnerComponent, MatIconModule],
  template: `
    <section class="relative min-h-[88vh] overflow-hidden">
      @for (slide of slides; track slide.id; let i = $index) {
        <div
          class="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          [class.opacity-100]="i === activeSlide"
          [class.opacity-0]="i !== activeSlide"
          [style.background-image]="'url(' + slide.imageUrl + ')'"
        ></div>
      }

      <div class="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col items-start justify-end px-4 pb-10 pt-14 sm:min-h-[88vh] sm:px-6 sm:pb-14 lg:px-8">
        <h1 class="max-w-2xl animate-hero-enter text-left font-display text-xl font-medium text-white drop-shadow-md sm:text-3xl">
          {{ currentSlide?.title || 'Island deals, discovered near you' }}
        </h1>

        @if (slides.length > 1) {
          <div class="mt-5 flex items-center gap-3">
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-teal-200 bg-white/95 text-teal-800 shadow-sm hover:bg-white"
              (click)="prevSlide()"
              aria-label="Previous slide"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div class="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
              @for (slide of slides; track slide.id; let i = $index) {
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  (click)="goToSlide(i)"
                  [attr.aria-label]="'Go to slide ' + (i + 1)"
                  [attr.aria-current]="i === activeSlide ? 'true' : null"
                >
                  <span
                    [class]="
                      'block h-2.5 w-2.5 rounded-full transition ' +
                      (i === activeSlide ? 'bg-gold-500' : 'bg-teal-200')
                    "
                  ></span>
                </button>
              }
            </div>
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-teal-200 bg-white/95 text-teal-800 shadow-sm hover:bg-white"
              (click)="nextSlide()"
              aria-label="Next slide"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      </div>
    </section>

    <section class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <h2 class="section-title">Featured this week</h2>
          <p class="section-sub">Hand-picked savings across the island.</p>
        </div>
        <a
          routerLink="/offers"
          class="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          View all
        </a>
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else {
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (offer of featured; track offer.id) {
            <app-offer-card [offer]="offer" />
          }
        </div>
      }
    </section>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly offersService = inject(OffersService);
  private readonly heroSlidesService = inject(HeroSlidesService);

  private readonly fallbackSlide: HeroSlide = {
    id: 'fallback',
    title: 'Island deals, discovered near you',
    subtitle:
      'Browse food, fashion, travel and wellness offers from trusted Sri Lankan shops — all in one place.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80',
    ctaLabel: 'Browse offers',
    ctaLink: '/offers',
  };

  featured: Offer[] = [];
  slides: HeroSlide[] = [this.fallbackSlide];
  activeSlide = 0;
  loading = true;

  private timer?: ReturnType<typeof setInterval>;

  get currentSlide(): HeroSlide | undefined {
    return this.slides[this.activeSlide];
  }

  ngOnInit(): void {
    this.heroSlidesService.getActive().subscribe((slides) => {
      this.slides = slides.length ? slides : [this.fallbackSlide];
      this.activeSlide = 0;
      this.startSlideshow();
    });

    this.offersService.getFeatured().subscribe((offers) => {
      this.featured = offers.slice(0, 3);
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  goToSlide(index: number): void {
    this.activeSlide = index;
    this.startSlideshow();
  }

  nextSlide(): void {
    if (this.slides.length < 2) return;
    this.activeSlide = (this.activeSlide + 1) % this.slides.length;
    this.startSlideshow();
  }

  prevSlide(): void {
    if (this.slides.length < 2) return;
    this.activeSlide = (this.activeSlide - 1 + this.slides.length) % this.slides.length;
    this.startSlideshow();
  }

  private startSlideshow(): void {
    this.stopSlideshow();
    if (this.slides.length < 2) return;
    this.timer = setInterval(() => {
      this.activeSlide = (this.activeSlide + 1) % this.slides.length;
    }, 5000);
  }

  private stopSlideshow(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
