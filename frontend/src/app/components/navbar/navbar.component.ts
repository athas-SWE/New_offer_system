import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe, MatIconModule, MatButtonModule],
  template: `
    <header
      class="sticky top-0 z-50 border-b border-teal-200/70 bg-white/90 shadow-[0_8px_30px_rgba(0,28,61,0.08)] backdrop-blur-xl"
    >
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3.5 sm:gap-5 sm:px-6 sm:py-4 lg:px-8"
      >
        <a
          routerLink="/"
          class="min-w-0 shrink transition hover:opacity-90"
          aria-label="Offer Lanka home"
          (click)="menuOpen = false"
        >
          <img
            src="images/logo.png"
            alt="Offer Lanka"
            class="h-16 w-auto max-w-[200px] object-contain object-left sm:h-[4.5rem] sm:max-w-none md:h-24"
          />
        </a>

        <nav
          class="hidden items-center gap-1 rounded-2xl border border-teal-100 bg-teal-50/60 p-1.5 md:flex"
        >
          @for (link of links; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-teal-700 text-white shadow-sm"
              [routerLinkActiveOptions]="{ exact: false }"
              class="rounded-xl px-5 py-2.5 font-display text-lg font-semibold tracking-wide text-teal-800 transition hover:bg-white hover:text-teal-900"
              >{{ link.label }}</a
            >
          }
        </nav>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <a
            routerLink="/search"
            class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
            aria-label="Search"
          >
            <mat-icon>search</mat-icon>
          </a>

          <div class="hidden items-center gap-2.5 sm:flex">
            <ng-container *ngIf="auth.currentUser$ | async as user; else guestDesktop">
              <a
                routerLink="/profile"
                class="hidden rounded-xl border border-teal-100 bg-white px-4 py-2.5 text-base font-semibold text-teal-800 transition hover:bg-teal-50 md:inline-flex"
              >
                {{ user.name }}
              </a>
              @if (auth.isAdmin()) {
                <a routerLink="/admin" class="btn-primary !px-5 !py-2.5 !text-base">Admin</a>
              }
              @if (auth.isShopOwner()) {
                <a routerLink="/business" class="btn-primary !px-5 !py-2.5 !text-base">Shop</a>
              }
            </ng-container>
            <ng-template #guestDesktop>
              <a routerLink="/login" class="btn-secondary !px-5 !py-2.5 !text-base">Log in</a>
              <a
                routerLink="/register"
                class="btn-gold !hidden !px-5 !py-2.5 !text-base md:!inline-flex"
              >
                Register your Shop
              </a>
            </ng-template>
          </div>

          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-800 transition hover:bg-teal-100 md:hidden"
            (click)="menuOpen = !menuOpen"
            [attr.aria-expanded]="menuOpen"
            aria-label="Menu"
          >
            <mat-icon>{{ menuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>

      @if (menuOpen) {
        <div class="border-t border-teal-100 bg-gradient-to-b from-white to-teal-50/40 px-4 py-4 md:hidden">
          <div class="flex flex-col gap-1.5">
            @for (link of links; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="bg-teal-700 text-white"
                class="rounded-xl px-4 py-3 font-display text-lg font-semibold text-teal-900 transition hover:bg-teal-100"
                (click)="menuOpen = false"
              >
                {{ link.label }}
              </a>
            }
            <div class="my-2 border-t border-teal-200/80"></div>
            <ng-container *ngIf="auth.currentUser$ | async as user; else guestMobile">
              <a
                routerLink="/profile"
                class="rounded-xl px-4 py-3 text-base font-semibold text-teal-900 hover:bg-teal-100"
                (click)="menuOpen = false"
              >
                Profile · {{ user.name }}
              </a>
              @if (auth.isAdmin()) {
                <a
                  routerLink="/admin"
                  class="rounded-xl bg-teal-700 px-4 py-3 text-base font-semibold text-white"
                  (click)="menuOpen = false"
                >
                  Admin dashboard
                </a>
              }
              @if (auth.isShopOwner()) {
                <a
                  routerLink="/business"
                  class="rounded-xl bg-teal-700 px-4 py-3 text-base font-semibold text-white"
                  (click)="menuOpen = false"
                >
                  Shop dashboard
                </a>
              }
            </ng-container>
            <ng-template #guestMobile>
              <a
                routerLink="/login"
                class="rounded-xl px-4 py-3 text-base font-semibold text-teal-900 hover:bg-teal-100"
                (click)="menuOpen = false"
              >
                Log in
              </a>
              <a
                routerLink="/register"
                class="btn-gold mt-1 !w-full !py-3 !text-base"
                (click)="menuOpen = false"
              >
                Register your Shops
              </a>
            </ng-template>
          </div>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);

  menuOpen = false;
  links = [
    { path: '/offers', label: 'Offers' },
    { path: '/categories', label: 'Categories' },
    { path: '/shops', label: 'Shops' },
  ];
}
