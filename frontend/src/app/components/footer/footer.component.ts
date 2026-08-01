import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="mt-auto border-t border-teal-100 bg-teal-900 text-teal-50">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div class="inline-flex rounded-2xl bg-white px-3 py-2">
            <img src="images/logo.png" alt="Offer Lanka" class="h-14 w-auto object-contain" />
          </div>
          <p class="mt-3 text-sm text-teal-100/80">
            Sri Lanka's marketplace for everyday deals — focused on Ampara coastal towns.
          </p>
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold-400">Explore</p>
          <div class="mt-3 flex flex-col gap-2 text-sm">
            <a routerLink="/offers" class="hover:text-gold-400">Offers</a>
            <a routerLink="/categories" class="hover:text-gold-400">Categories</a>
            <a routerLink="/shops" class="hover:text-gold-400">Shops</a>
            <a routerLink="/search" class="hover:text-gold-400">Search</a>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold-400">Company</p>
          <div class="mt-3 flex flex-col gap-2 text-sm">
            <a routerLink="/about" class="hover:text-gold-400">About</a>
            <a routerLink="/contact" class="hover:text-gold-400">Contact</a>
            <a routerLink="/register" class="hover:text-gold-400">Register your Shop</a>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold-400">Cities</p>
          <p class="mt-3 text-sm text-teal-100/80">
            Kalmunai · Maruthamunai · Sainthamaruthu · Ampara · Ninthavur · Sammanthurai · Pottuvil · Akkaraipattu ·
            Karaithivu
          </p>
        </div>
      </div>
      <div class="border-t border-teal-800 py-4 text-center text-xs text-teal-200/70">
        © {{ year }} Offer Lanka. Crafted for island deals.
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
