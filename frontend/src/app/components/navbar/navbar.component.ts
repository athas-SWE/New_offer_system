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
      class="sticky top-0 z-50 border-b border-teal-200/70 bg-white/90 pt-[env(safe-area-inset-top)] shadow-[0_8px_30px_rgba(0,28,61,0.08)] backdrop-blur-xl"
    >
      <div
        class="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3 lg:gap-4 lg:px-8"
      >
        <a
          routerLink="/"
          class="min-w-0 shrink-0 transition hover:opacity-90"
          aria-label="Offer Lanka home"
          (click)="menuOpen = false"
        >
          <img
            src="images/logo.png"
            alt="Offer Lanka"
            class="h-10 w-auto max-w-[120px] object-contain object-left sm:h-12 sm:max-w-[150px] lg:h-14 lg:max-w-[170px]"
          />
        </a>

        <nav
          class="mx-auto hidden min-w-0 flex-1 items-center justify-center lg:flex"
        >
          <div
            class="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-teal-100 bg-teal-50/60 p-1"
          >
            @for (link of links; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="bg-teal-700 text-white shadow-sm"
                [routerLinkActiveOptions]="{ exact: false }"
                class="whitespace-nowrap rounded-xl px-3 py-2 font-display text-sm font-semibold tracking-wide text-teal-800 transition hover:bg-white hover:text-teal-900 xl:px-4 xl:text-base"
                >{{ link.label }}</a
              >
            }
          </div>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            routerLink="/favorites"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 sm:h-11 sm:w-11"
            aria-label="Favourites"
          >
            <mat-icon>favorite_border</mat-icon>
          </a>
          <a
            routerLink="/search"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 sm:h-11 sm:w-11"
            aria-label="Search"
          >
            <mat-icon>search</mat-icon>
          </a>

          <div class="hidden items-center gap-2 lg:flex">
            <ng-container *ngIf="auth.currentUser$ | async as user; else guestDesktop">
              <a
                routerLink="/profile"
                class="max-w-[9rem] truncate rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 xl:max-w-[12rem] xl:px-4"
              >
                {{ user.name }}
              </a>
              @if (auth.isAdmin()) {
                <a routerLink="/admin" class="btn-primary !px-4 !py-2 !text-sm">Admin</a>
              }
              @if (auth.isShopOwner()) {
                <a routerLink="/business" class="btn-primary !px-4 !py-2 !text-sm">Shop</a>
              }
              <button
                type="button"
                class="btn-secondary !px-4 !py-2 !text-sm"
                (click)="auth.logout()"
              >
                Log out
              </button>
            </ng-container>
            <ng-template #guestDesktop>
              <a routerLink="/login" class="btn-secondary !px-4 !py-2 !text-sm">Log in</a>
              <a routerLink="/signup" class="btn-primary !px-4 !py-2 !text-sm">Sign up</a>
              <a routerLink="/register" class="btn-gold !hidden !px-4 !py-2 !text-sm xl:!inline-flex">
                Register shop
              </a>
            </ng-template>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-800 transition hover:bg-teal-100 sm:h-11 sm:w-11 lg:hidden"
            (click)="menuOpen = !menuOpen"
            [attr.aria-expanded]="menuOpen"
            aria-label="Menu"
          >
            <mat-icon>{{ menuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>

      @if (menuOpen) {
        <div class="border-t border-teal-100 bg-gradient-to-b from-white to-teal-50/40 px-4 py-4 lg:hidden">
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
            <a
              routerLink="/favorites"
              class="rounded-xl px-4 py-3 font-display text-lg font-semibold text-teal-900 transition hover:bg-teal-100"
              (click)="menuOpen = false"
            >
              Favourites
            </a>
            <div class="my-2 border-t border-teal-200/80"></div>
            <ng-container *ngIf="auth.currentUser$ | async as user; else guestMobile">
              <a
                routerLink="/profile"
                class="rounded-xl px-4 py-3 text-base font-semibold text-teal-900 hover:bg-teal-100"
                (click)="menuOpen = false"
              >
                Profile · {{ user.name }}
              </a>
              <a
                routerLink="/notifications"
                class="rounded-xl px-4 py-3 text-base font-semibold text-teal-900 hover:bg-teal-100"
                (click)="menuOpen = false"
              >
                Notifications
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
              <button
                type="button"
                class="rounded-xl px-4 py-3 text-left text-base font-semibold text-red-700 hover:bg-red-50"
                (click)="menuOpen = false; auth.logout()"
              >
                Log out
              </button>
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
                routerLink="/signup"
                class="btn-primary mt-1 !w-full !py-3 !text-base"
                (click)="menuOpen = false"
              >
                Sign up
              </a>
              <a
                routerLink="/register"
                class="btn-gold mt-1 !w-full !py-3 !text-base"
                (click)="menuOpen = false"
              >
                Register your shop
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
    { path: '/services', label: 'Services' },
    { path: '/rentals', label: 'Rentals' },
    { path: '/categories', label: 'Categories' },
    { path: '/shops', label: 'Shops' },
  ];
}
