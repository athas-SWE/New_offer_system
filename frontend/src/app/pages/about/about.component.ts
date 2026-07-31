import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 px-6 py-14 text-white sm:px-12">
        <p class="font-display text-4xl font-semibold sm:text-5xl">About Offer Lanka</p>
        <p class="mt-4 max-w-2xl text-lg text-teal-50/90">
          We help Sri Lankans discover real savings — and help local businesses fill tables, rooms and racks.
        </p>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-2">
        <div class="surface-panel">
          <h2 class="font-display text-2xl font-semibold text-teal-900">Our mission</h2>
          <p class="mt-3 text-[var(--color-muted)]">
            Offer Lanka connects shoppers with time-bound deals from verified stores across the island — from Colombo cafés
            to hill-country lodges. We focus on clarity, locality and trust.
          </p>
        </div>
        <div class="surface-panel">
          <h2 class="font-display text-2xl font-semibold text-teal-900">For businesses</h2>
          <p class="mt-3 text-[var(--color-muted)]">
            List offers, track views and reach nearby customers. Register as a business to open your dashboard and grow
            footfall with promotions that feel native to Sri Lanka.
          </p>
          <a routerLink="/register" class="btn-primary mt-5">List your business</a>
        </div>
      </div>
    </div>
  `,
})
export class AboutComponent {}
