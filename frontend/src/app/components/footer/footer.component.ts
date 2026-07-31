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
          <p class="font-display text-2xl font-semibold text-white">Offer Lanka</p>
          <p class="mt-3 text-sm text-teal-100/80">
            Sri Lanka's marketplace for everyday deals — from Colombo cafés to hill-country stays.
          </p>
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold-400">Explore</p>
          <div class="mt-3 flex flex-col gap-2 text-sm">
            <a routerLink="/offers" class="hover:text-gold-400">Offers</a>
            <a routerLink="/categories" class="hover:text-gold-400">Categories</a>
            <a routerLink="/stores" class="hover:text-gold-400">Stores</a>
            <a routerLink="/search" class="hover:text-gold-400">Search</a>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold-400">Company</p>
          <div class="mt-3 flex flex-col gap-2 text-sm">
            <a routerLink="/about" class="hover:text-gold-400">About</a>
            <a routerLink="/contact" class="hover:text-gold-400">Contact</a>
            <a routerLink="/register" class="hover:text-gold-400">List your business</a>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-gold-400">Cities</p>
          <p class="mt-3 text-sm text-teal-100/80">Colombo · Kandy · Galle · Negombo · Nuwara Eliya · Jaffna</p>
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
