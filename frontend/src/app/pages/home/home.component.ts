import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OffersService } from '../../services/offers.service';
import { CategoriesService } from '../../services/categories.service';
import { HeroSlidesService } from '../../services/hero-slides.service';
import { HeroSlide } from '../../services/admin.service';
import { Offer, Category } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, OfferCardComponent, LoadingSpinnerComponent, MatIconModule],
  template: `
    <section class="relative min-h-[88vh] overflow-hidden text-white">
      @for (slide of slides; track slide.id; let i = $index) {
        <div
          class="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          [class.opacity-100]="i === activeSlide"
          [class.opacity-0]="i !== activeSlide"
          [style.background-image]="
            'linear-gradient(120deg, rgba(13,92,86,0.92), rgba(15,78,74,0.75)), url(' + slide.imageUrl + ')'
          "
        ></div>
      }
      <div
        class="absolute inset-0 opacity-30"
        style="background-image: radial-gradient(circle at 20% 20%, rgba(251,191,36,0.35), transparent 40%), radial-gradient(circle at 80% 60%, rgba(20,184,166,0.35), transparent 35%);"
      ></div>

      <div class="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-14 sm:min-h-[88vh] sm:px-6 sm:py-20 lg:px-8">
        <div class="max-w-2xl animate-hero-enter">
          <div class="inline-flex max-w-full rounded-2xl bg-white/95 px-3 py-3 shadow-lift backdrop-blur sm:rounded-3xl sm:px-5 sm:py-4">
            <img
              src="images/logo.png"
              alt="Offer Lanka — Sri Lanka's Daily Offers Hub"
              class="h-16 w-auto max-w-[220px] object-contain sm:h-28 sm:max-w-none lg:h-36"
            />
          </div>
          <h1 class="mt-5 font-display text-xl font-medium text-teal-50 sm:mt-6 sm:text-3xl">
            {{ currentSlide?.title || 'Island deals, discovered near you' }}
          </h1>
          <p class="mt-3 max-w-lg text-sm text-teal-50/85 sm:mt-4 sm:text-lg">
            {{
              currentSlide?.subtitle ||
                'Browse food, fashion, travel and wellness offers from trusted Sri Lankan shops — all in one place.'
            }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3 sm:mt-8">
            @if (isExternalLink(currentSlide?.ctaLink)) {
              <a [href]="currentSlide?.ctaLink" class="btn-gold" target="_blank" rel="noopener">
                {{ currentSlide?.ctaLabel || 'Browse offers' }}
              </a>
            } @else {
              <a [routerLink]="currentSlide?.ctaLink || '/offers'" class="btn-gold">
                {{ currentSlide?.ctaLabel || 'Browse offers' }}
              </a>
            }
            <a
              routerLink="/shops"
              class="btn-secondary !border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
            >
              Explore shops
            </a>
          </div>
        </div>

        @if (slides.length > 1) {
          <div class="mt-10 flex items-center gap-3">
            <button
              type="button"
              class="rounded-full border border-white/30 bg-white/10 p-2 hover:bg-white/20"
              (click)="prevSlide()"
              aria-label="Previous slide"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div class="flex gap-2">
              @for (slide of slides; track slide.id; let i = $index) {
                <button
                  type="button"
                  [class]="
                    'h-2.5 w-2.5 rounded-full transition ' +
                    (i === activeSlide ? 'bg-amber-300' : 'bg-white/40')
                  "
                  (click)="goToSlide(i)"
                  [attr.aria-label]="'Go to slide ' + (i + 1)"
                >
                </button>
              }
            </div>
            <button
              type="button"
              class="rounded-full border border-white/30 bg-white/10 p-2 hover:bg-white/20"
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
      <div class="flex items-end justify-between gap-4">
        <div>
          <h2 class="section-title">Featured this week</h2>
          <p class="section-sub">Hand-picked savings across the island.</p>
        </div>
        <a routerLink="/offers" class="text-sm font-semibold text-teal-700 hover:text-teal-900">View all</a>
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

    <section class="page-shell pt-0">
      <h2 class="section-title">Shop by category</h2>
      <p class="section-sub">Find the right kind of deal faster.</p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (cat of categories; track cat.id) {
          <a
            [routerLink]="['/offers']"
            [queryParams]="{ categoryId: cat.id }"
            class="surface-panel flex items-start gap-4 transition hover:-translate-y-1 hover:shadow-lift"
          >
            <span
              class="flex h-12 w-12 items-center justify-center rounded-xl text-white"
              [style.background]="cat.color || '#0d9488'"
            >
              <mat-icon>{{ cat.icon }}</mat-icon>
            </span>
            <div>
              <h3 class="font-display text-lg font-semibold text-teal-900">{{ cat.name }}</h3>
              <p class="mt-1 text-sm text-[var(--color-muted)]">{{ cat.description }}</p>
              <p class="mt-2 text-xs font-semibold text-teal-600">{{ cat.offerCount }} offers</p>
            </div>
          </a>
        }
      </div>
    </section>

    <section class="page-shell pt-0">
      <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-10 text-white sm:px-10">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="font-display text-3xl font-semibold">Nearby offers</h2>
            <p class="mt-2 max-w-xl text-teal-100">
              Enable location to see deals around your area — Colombo today, your city next.
            </p>
          </div>
          <button type="button" class="btn-gold" (click)="loadNearby()">
            <mat-icon>near_me</mat-icon>
            Show nearby
          </button>
        </div>
        @if (nearby.length) {
          <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (offer of nearby; track offer.id) {
              <app-offer-card [offer]="offer" />
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly offersService = inject(OffersService);
  private readonly categoriesService = inject(CategoriesService);
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
  nearby: Offer[] = [];
  categories: Category[] = [];
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
    this.categoriesService.getCategories().subscribe((cats) => (this.categories = cats));
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

  isExternalLink(link?: string | null): boolean {
    return !!link && /^https?:\/\//i.test(link);
  }

  loadNearby(): void {
    if (!navigator.geolocation) {
      this.offersService.getNearby(6.9271, 79.8612).subscribe((offers) => (this.nearby = offers.slice(0, 3)));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.offersService
          .getNearby(pos.coords.latitude, pos.coords.longitude)
          .subscribe((offers) => (this.nearby = offers.slice(0, 3)));
      },
      () => {
        this.offersService.getNearby(6.9271, 79.8612).subscribe((offers) => (this.nearby = offers.slice(0, 3)));
      }
    );
  }

  private startSlideshow(): void {
    this.stopSlideshow();
    if (this.slides.length < 2) return;
    this.timer = setInterval(() => {
      this.activeSlide = (this.activeSlide + 1) % this.slides.length;
    }, 6000);
  }

  private stopSlideshow(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
