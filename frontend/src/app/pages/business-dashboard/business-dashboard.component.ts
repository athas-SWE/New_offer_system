import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { BusinessProfile, BusinessService } from '../../services/business.service';
import { DashboardOfferRow, DashboardStats } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

type Tab = 'overview' | 'stores' | 'offers';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent, ReactiveFormsModule],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Shop dashboard</h1>
          <p class="section-sub">Manage your shop, publish offers, and track performance.</p>
        </div>
        <a routerLink="/offers" class="btn-secondary">
          <mat-icon>storefront</mat-icon>
          Preview marketplace
        </a>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-semibold transition"
            [class.bg-teal-700]="activeTab === tab.id"
            [class.text-white]="activeTab === tab.id"
            [class.bg-teal-50]="activeTab !== tab.id"
            [class.text-teal-800]="activeTab !== tab.id"
            (click)="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else if (error) {
        <div class="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
      } @else {
        @if (justRegistered) {
          <div class="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Shop application submitted. An admin will review it shortly. You can prepare offers while you wait, but the shop stays hidden until approved.
          </div>
        }

        @if (business) {
          <div class="mt-6 surface-panel flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-4">
              @if (business.logoUrl) {
                <img
                  [src]="business.logoUrl"
                  [alt]="business.name"
                  class="h-16 w-16 rounded-xl object-cover ring-1 ring-teal-100"
                />
              }
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-teal-600">My shop</p>
                <h2 class="font-display text-2xl font-semibold text-teal-900">{{ business.name }}</h2>
                <p class="text-sm text-[var(--color-muted)]">{{ business.address || 'No address set' }}</p>
              </div>
            </div>
            <span class="chip">{{ business.status }}</span>
          </div>
          @if (business.status === 'PENDING') {
            <div class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Status: <strong>PENDING</strong> — your shop is not public yet. Admin must approve it under Admin → Shops.
            </div>
          } @else if (business.status === 'REJECTED') {
            <div class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Status: <strong>REJECTED</strong> — contact support or update your shop details and ask admin to re-review.
            </div>
          } @else if (business.status === 'SUSPENDED') {
            <div class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Status: <strong>SUSPENDED</strong> — publishing is limited until an admin restores your shop.
            </div>
          }
        } @else {
          <div class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No shop is linked to this account yet.
            <a routerLink="/register" class="font-semibold text-teal-800 underline">Register a shop</a>
            or ask admin to approve your application.
          </div>
        }

        @if (activeTab === 'overview' && stats) {
          <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (card of cards; track card.label) {
              <div class="surface-panel">
                <p class="text-sm text-[var(--color-muted)]">{{ card.label }}</p>
                <p class="mt-2 font-display text-3xl font-semibold text-teal-900">{{ card.value }}</p>
              </div>
            }
          </div>

          <div class="mt-10 surface-panel overflow-x-auto">
            <h2 class="font-display text-xl font-semibold text-teal-900">Recent offers</h2>
            @if (!rows.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">No offers yet. Create one in the Offers tab.</p>
            } @else {
              <table class="mt-4 w-full min-w-[640px] text-left text-sm">
                <thead class="border-b border-teal-100 text-[var(--color-muted)]">
                  <tr>
                    <th class="pb-3 font-medium">Title</th>
                    <th class="pb-3 font-medium">Status</th>
                    <th class="pb-3 font-medium">Views</th>
                    <th class="pb-3 font-medium">Saves</th>
                    <th class="pb-3 font-medium">Ends</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows; track row.id) {
                    <tr class="border-b border-teal-50">
                      <td class="py-3 font-medium text-teal-900">
                        <a [routerLink]="['/offers', row.id]" class="hover:underline">{{ row.title }}</a>
                      </td>
                      <td class="py-3"><span class="chip">{{ row.status }}</span></td>
                      <td class="py-3">{{ row.views }}</td>
                      <td class="py-3">{{ row.saves }}</td>
                      <td class="py-3">{{ row.endsAt | date: 'mediumDate' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }

        @if (activeTab === 'stores') {
          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <form class="surface-panel space-y-4" [formGroup]="storeForm" (ngSubmit)="createStore()">
              <h2 class="font-display text-xl font-semibold text-teal-900">Add shop location</h2>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storeName">Shop name</label>
                <input id="storeName" class="input-field" formControlName="name" placeholder="Galle Face Branch" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storeAddress">Address</label>
                <input id="storeAddress" class="input-field" formControlName="address" placeholder="Colombo 03" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storePhone">Phone</label>
                <input id="storePhone" class="input-field" formControlName="phone" placeholder="+94 77 000 0000" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storeDesc">Description</label>
                <textarea id="storeDesc" rows="3" class="input-field" formControlName="description"></textarea>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storeLogo">Shop logo</label>
                <input
                  id="storeLogo"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                  (change)="onStoreLogoSelected($event)"
                />
                @if (storeLogoPreview) {
                  <img [src]="storeLogoPreview" alt="Logo preview" class="mt-3 h-20 w-20 rounded-xl object-cover" />
                }
              </div>
              @if (storeMessage) {
                <p class="text-sm font-medium text-teal-700">{{ storeMessage }}</p>
              }
              @if (storeError) {
                <p class="text-sm text-red-700">{{ storeError }}</p>
              }
              <button type="submit" class="btn-primary" [disabled]="storeForm.invalid || savingStore">
                {{ savingStore ? 'Saving…' : 'Create shop' }}
              </button>
            </form>

            <div class="surface-panel">
              <h2 class="font-display text-xl font-semibold text-teal-900">Your shops</h2>
              @if (!business?.stores?.length) {
                <p class="mt-4 text-sm text-[var(--color-muted)]">No shops yet.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (store of business?.stores; track store.id) {
                    <li class="rounded-xl border border-teal-50 px-4 py-3">
                      <div class="flex items-start gap-3">
                        @if (store.logoUrl) {
                          <img
                            [src]="store.logoUrl"
                            [alt]="store.name"
                            class="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        } @else {
                          <div
                            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"
                          >
                            <mat-icon>store</mat-icon>
                          </div>
                        }
                        <div class="min-w-0 flex-1">
                          <p class="font-semibold text-teal-900">{{ store.name }}</p>
                          <p class="text-sm text-[var(--color-muted)]">{{ store.address || 'No address' }}</p>
                          <p class="text-xs text-teal-700">{{ store.phone }}</p>
                          <label class="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-teal-700 hover:underline">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              class="sr-only"
                              (change)="uploadLogoForShop(store.id, $event)"
                            />
                            {{ uploadingLogoId === store.id ? 'Uploading…' : 'Upload / change logo' }}
                          </label>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        }

        @if (activeTab === 'offers') {
          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <form class="surface-panel space-y-4" [formGroup]="offerForm" (ngSubmit)="createOffer()">
              <h2 class="font-display text-xl font-semibold text-teal-900">Create offer</h2>
              <div>
                <label class="mb-1 block text-sm font-medium" for="offerTitle">Title</label>
                <input id="offerTitle" class="input-field" formControlName="title" placeholder="Weekend lunch deal" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="offerDesc">Description</label>
                <textarea id="offerDesc" rows="3" class="input-field" formControlName="description"></textarea>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium" for="discount">Discount %</label>
                  <input id="discount" type="number" class="input-field" formControlName="discountPercent" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium" for="coupon">Coupon</label>
                  <input id="coupon" class="input-field" formControlName="couponCode" placeholder="SAVE20" />
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium" for="start">Start date</label>
                  <input id="start" type="date" class="input-field" formControlName="startDate" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium" for="end">End date</label>
                  <input id="end" type="date" class="input-field" formControlName="endDate" />
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="status">Status</label>
                <select id="status" class="input-field" formControlName="status">
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active (live)</option>
                  <option value="PENDING">Pending approval</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="offerImage">Offer image</label>
                <input
                  id="offerImage"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                  (change)="onOfferImageSelected($event)"
                />
                @if (offerImagePreview) {
                  <img [src]="offerImagePreview" alt="Offer preview" class="mt-3 h-28 w-full max-w-xs rounded-xl object-cover" />
                }
              </div>
              @if (offerMessage) {
                <p class="text-sm font-medium text-teal-700">{{ offerMessage }}</p>
              }
              @if (offerError) {
                <p class="text-sm text-red-700">{{ offerError }}</p>
              }
              <button type="submit" class="btn-primary" [disabled]="offerForm.invalid || savingOffer">
                {{ savingOffer ? 'Publishing…' : 'Create offer' }}
              </button>
            </form>

            <div class="surface-panel overflow-x-auto">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-display text-xl font-semibold text-teal-900">Manage offers</h2>
                <button type="button" class="text-sm font-semibold text-teal-700 hover:underline" (click)="reloadOffers()">
                  Refresh
                </button>
              </div>
              @if (!managedOffers.length) {
                <p class="mt-4 text-sm text-[var(--color-muted)]">No offers to manage.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (row of managedOffers; track row.id) {
                    <li class="rounded-xl border border-teal-50 px-4 py-3 text-sm">
                      <div class="flex flex-wrap items-start gap-3">
                        @if (row.imageUrl) {
                          <img [src]="row.imageUrl" [alt]="row.title" class="h-14 w-14 rounded-lg object-cover" />
                        }
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <a [routerLink]="['/offers', row.id]" class="font-semibold text-teal-900 hover:underline">
                                {{ row.title }}
                              </a>
                              <p class="text-[var(--color-muted)]">
                                {{ row.views }} views · ends {{ row.endsAt | date: 'mediumDate' }}
                              </p>
                            </div>
                            <span class="chip">{{ row.status }}</span>
                          </div>
                          <div class="mt-3 flex flex-wrap gap-2">
                            <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="setStatus(row.id, 'ACTIVE')">
                              Publish
                            </button>
                            <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="setStatus(row.id, 'DRAFT')">
                              Draft
                            </button>
                            <label class="btn-secondary !mb-0 !px-3 !py-1.5 text-xs">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                class="sr-only"
                                (change)="uploadImageForOffer(row.id, $event)"
                              />
                              {{ uploadingOfferImageId === row.id ? 'Uploading…' : 'Image' }}
                            </label>
                            <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs !text-red-700" (click)="removeOffer(row.id)">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class BusinessDashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly businessApi = inject(BusinessService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  activeTab: Tab = 'overview';
  justRegistered = false;
  tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'stores', label: 'Shops' },
    { id: 'offers', label: 'Offers' },
  ];

  stats?: DashboardStats;
  rows: DashboardOfferRow[] = [];
  managedOffers: DashboardOfferRow[] = [];
  business?: BusinessProfile;
  loading = true;
  error = '';
  cards: { label: string; value: string }[] = [];

  savingStore = false;
  storeMessage = '';
  storeError = '';
  savingOffer = false;
  offerMessage = '';
  offerError = '';

  storeLogoFile: File | null = null;
  storeLogoPreview = '';
  offerImageFile: File | null = null;
  offerImagePreview = '';
  uploadingLogoId = '';
  uploadingOfferImageId = '';

  storeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    address: [''],
    phone: [''],
    description: [''],
  });

  offerForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    discountPercent: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
    startDate: [this.today(), Validators.required],
    endDate: [this.plusDays(30), Validators.required],
    couponCode: [''],
    status: ['ACTIVE' as const, Validators.required],
  });

  ngOnInit(): void {
    this.justRegistered = this.route.snapshot.queryParamMap.get('registered') === '1';
    this.reloadAll();
  }

  reloadAll(): void {
    this.loading = true;
    this.error = '';

    this.dashboard.getBusinessStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cards = [
          { label: 'Total offers', value: String(stats.totalOffers) },
          { label: 'Active', value: String(stats.activeOffers) },
          { label: 'Views', value: String(stats.totalViews) },
          { label: 'Favourites', value: String(stats.favorites) },
          { label: 'Shops', value: String(stats.stores ?? 0) },
          { label: 'Likes', value: String(stats.likes ?? 0) },
          { label: 'Reviews', value: String(stats.reviews ?? 0) },
        ];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load shop dashboard. Please log in as a shop owner.';
        this.loading = false;
      },
    });

    this.dashboard.getBusinessOffers().subscribe((rows) => (this.rows = rows));
    this.reloadOffers();
    this.businessApi.getMine().subscribe({
      next: (biz) => (this.business = biz),
      error: () => (this.business = undefined),
    });
  }

  reloadOffers(): void {
    this.businessApi.getManagedOffers().subscribe({
      next: (rows) => (this.managedOffers = rows),
      error: () => (this.managedOffers = []),
    });
  }

  onStoreLogoSelected(event: Event): void {
    const file = this.fileFromEvent(event);
    this.storeLogoFile = file;
    this.storeLogoPreview = file ? URL.createObjectURL(file) : '';
  }

  onOfferImageSelected(event: Event): void {
    const file = this.fileFromEvent(event);
    this.offerImageFile = file;
    this.offerImagePreview = file ? URL.createObjectURL(file) : '';
  }

  createStore(): void {
    if (this.storeForm.invalid) return;
    this.savingStore = true;
    this.storeMessage = '';
    this.storeError = '';
    this.businessApi.createStoreWithLogo(this.storeForm.getRawValue(), this.storeLogoFile).subscribe({
      next: () => {
        this.savingStore = false;
        this.storeMessage = this.storeLogoFile ? 'Shop created with logo.' : 'Shop created.';
        this.storeForm.reset({ name: '', address: '', phone: '', description: '' });
        this.clearStoreLogo();
        this.reloadAll();
      },
      error: (err: Error) => {
        this.savingStore = false;
        this.storeError = err.message || 'Could not create store.';
      },
    });
  }

  uploadLogoForShop(shopId: string, event: Event): void {
    const file = this.fileFromEvent(event);
    if (!file) return;
    this.uploadingLogoId = shopId;
    this.storeError = '';
    this.businessApi.uploadShopLogo(shopId, file).subscribe({
      next: () => {
        this.uploadingLogoId = '';
        this.storeMessage = 'Logo updated.';
        this.reloadAll();
      },
      error: (err: Error) => {
        this.uploadingLogoId = '';
        this.storeError = err.message || 'Could not upload logo.';
      },
    });
  }

  createOffer(): void {
    if (this.offerForm.invalid) return;
    this.savingOffer = true;
    this.offerMessage = '';
    this.offerError = '';
    const value = this.offerForm.getRawValue();
    this.businessApi
      .createOfferWithImage(
        {
          ...value,
          discountPercent: Number(value.discountPercent),
        },
        this.offerImageFile,
      )
      .subscribe({
        next: (offer) => {
          this.savingOffer = false;
          this.offerMessage = this.offerImageFile
            ? `Offer “${offer.title}” created with image (${offer.status}).`
            : `Offer “${offer.title}” created (${offer.status}).`;
          this.offerForm.patchValue({
            title: '',
            description: '',
            couponCode: '',
            discountPercent: 20,
            startDate: this.today(),
            endDate: this.plusDays(30),
            status: 'ACTIVE',
          });
          this.clearOfferImage();
          this.reloadAll();
          this.activeTab = 'offers';
        },
        error: (err: Error) => {
          this.savingOffer = false;
          this.offerError = err.message || 'Could not create offer.';
        },
      });
  }

  uploadImageForOffer(offerId: string, event: Event): void {
    const file = this.fileFromEvent(event);
    if (!file) return;
    this.uploadingOfferImageId = offerId;
    this.offerError = '';
    this.businessApi.uploadOfferImage(offerId, file).subscribe({
      next: () => {
        this.uploadingOfferImageId = '';
        this.offerMessage = 'Offer image updated.';
        this.reloadOffers();
      },
      error: (err: Error) => {
        this.uploadingOfferImageId = '';
        this.offerError = err.message || 'Could not upload offer image.';
      },
    });
  }

  setStatus(id: string, status: string): void {
    this.businessApi.updateOfferStatus(id, status).subscribe({
      next: () => this.reloadAll(),
      error: () => (this.offerError = 'Could not update offer status.'),
    });
  }

  removeOffer(id: string): void {
    this.businessApi.deleteOffer(id).subscribe({
      next: () => this.reloadAll(),
      error: () => (this.offerError = 'Could not delete offer.'),
    });
  }

  private fileFromEvent(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    input.value = '';
    return file;
  }

  private clearStoreLogo(): void {
    if (this.storeLogoPreview) URL.revokeObjectURL(this.storeLogoPreview);
    this.storeLogoFile = null;
    this.storeLogoPreview = '';
  }

  private clearOfferImage(): void {
    if (this.offerImagePreview) URL.revokeObjectURL(this.offerImagePreview);
    this.offerImageFile = null;
    this.offerImagePreview = '';
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private plusDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
