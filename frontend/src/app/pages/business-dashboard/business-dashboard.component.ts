import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { BusinessProfile, BusinessService } from '../../services/business.service';
import { ShopServicesService } from '../../services/shop-services.service';
import { RentalsService } from '../../services/rentals.service';
import { PosService } from '../../services/pos.service';
import {
  DashboardOfferRow,
  DashboardStats,
  ManagedListingRow,
  PosCartLine,
  PosPaymentMethod,
  PosProduct,
  PosSale,
  PosTodaySummary,
} from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import {
  ACCEPTED_IMAGE_ACCEPT,
  IMAGE_UPLOAD_HINT,
  fileFromInputEvent,
  validateImageFile,
} from '../../utils/image-upload';
import { City, LocationsService } from '../../services/locations.service';
import { formatLkr, offerPriceFrom, externalHref, displayUrl } from '../../shared/utils';

type Tab = 'overview' | 'stores' | 'offers' | 'services' | 'rentals' | 'pos';
type PosSubTab = 'counter' | 'products' | 'sales';
type ImageTarget = 'store' | 'offer' | 'service' | 'rental' | 'profile' | 'pos';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent, ReactiveFormsModule],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Shop dashboard</h1>
          <p class="section-sub">Manage your shop, publish offers, services, rentals, and POS.</p>
        </div>
        <a routerLink="/offers" class="btn-secondary">
          <mat-icon>storefront</mat-icon>
          Preview marketplace
        </a>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        @for (tab of visibleTabs; track tab.id) {
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-semibold transition"
            [class.bg-teal-700]="activeTab === tab.id"
            [class.text-white]="activeTab === tab.id"
            [class.bg-teal-50]="activeTab !== tab.id"
            [class.text-teal-800]="activeTab !== tab.id"
            (click)="setTab(tab.id)"
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
                <label class="mb-1 block text-sm font-medium" for="storeCity">City</label>
                <select id="storeCity" class="input-field" formControlName="cityId">
                  <option value="">Select a city</option>
                  @for (city of cities; track city.id) {
                    <option [value]="city.id">
                      {{ cityLabel(city) }}
                    </option>
                  }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storeAddress">Address</label>
                <input id="storeAddress" class="input-field" formControlName="address" placeholder="Main Street, Kalmunai" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="storeLocationUrl">Google Maps location URL</label>
                <input
                  id="storeLocationUrl"
                  class="input-field"
                  formControlName="locationUrl"
                  placeholder="https://maps.google.com/?q=7.4167,81.8167"
                />
                <p class="mt-1 text-xs text-[var(--color-muted)]">
                  Paste a Google Maps share link so customers can view your shop on the map.
                </p>
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
                  [accept]="acceptedImageAccept"
                  class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                  (change)="onStoreLogoSelected($event)"
                />
                <p class="mt-1 text-xs text-[var(--color-muted)]">{{ imageUploadHint }}</p>
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
                          <label class="mt-2 inline-flex cursor-pointer flex-col items-start gap-0.5 text-xs font-semibold text-teal-700 hover:underline">
                            <span class="inline-flex items-center gap-2">
                              <input
                                type="file"
                                [accept]="acceptedImageAccept"
                                class="sr-only"
                                (change)="uploadLogoForShop(store.id, $event)"
                              />
                              {{ uploadingLogoId === store.id ? 'Uploading…' : 'Upload / change logo' }}
                            </span>
                            <span class="font-normal text-[var(--color-muted)] no-underline">{{ imageUploadHint }}</span>
                          </label>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>

            @if (business?.id) {
              <form
                class="surface-panel space-y-4 lg:col-span-2"
                [formGroup]="profileForm"
                (ngSubmit)="saveProfile()"
              >
                <h2 class="font-display text-xl font-semibold text-teal-900">Shop social &amp; website</h2>
                <p class="text-sm text-[var(--color-muted)]">
                  Links shown on your public shop page so customers can follow you.
                </p>
                @if (business?.website || business?.instagramUrl || business?.facebookUrl) {
                  <div class="rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-xs text-teal-800">
                    <p class="font-semibold text-teal-900">Currently saved</p>
                    <ul class="mt-1 space-y-1 break-all">
                      @if (business?.website) {
                        <li>
                          Website:
                          <a
                            [href]="hrefOf(business?.website)"
                            target="_blank"
                            rel="noopener"
                            class="font-medium underline"
                            >{{ labelOf(business?.website) }}</a
                          >
                        </li>
                      }
                      @if (business?.instagramUrl) {
                        <li>
                          Instagram:
                          <a
                            [href]="hrefOf(business?.instagramUrl)"
                            target="_blank"
                            rel="noopener"
                            class="font-medium underline"
                            >{{ labelOf(business?.instagramUrl) }}</a
                          >
                        </li>
                      }
                      @if (business?.facebookUrl) {
                        <li>
                          Facebook:
                          <a
                            [href]="hrefOf(business?.facebookUrl)"
                            target="_blank"
                            rel="noopener"
                            class="font-medium underline"
                            >{{ labelOf(business?.facebookUrl) }}</a
                          >
                        </li>
                      }
                    </ul>
                  </div>
                }
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1 block text-sm font-medium" for="profileWebsite">Website</label>
                    <input
                      id="profileWebsite"
                      class="input-field"
                      formControlName="website"
                      placeholder="https://yoursite.lk"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium" for="profileInstagram">Instagram URL</label>
                    <input
                      id="profileInstagram"
                      class="input-field"
                      formControlName="instagramUrl"
                      placeholder="https://instagram.com/yourshop"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium" for="profileFacebook">Facebook URL</label>
                    <input
                      id="profileFacebook"
                      class="input-field"
                      formControlName="facebookUrl"
                      placeholder="https://facebook.com/yourshop"
                    />
                  </div>
                </div>
                @if (profileMessage) {
                  <p class="text-sm font-medium text-teal-700">{{ profileMessage }}</p>
                }
                @if (profileError) {
                  <p class="text-sm text-red-700">{{ profileError }}</p>
                }
                <button type="submit" class="btn-primary" [disabled]="savingProfile">
                  {{ savingProfile ? 'Saving…' : 'Save social links' }}
                </button>
              </form>
            }
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
                  <label class="mb-1 block text-sm font-medium" for="originalPrice">Original price (LKR)</label>
                  <input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input-field"
                    formControlName="originalPrice"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium" for="discount">Discount %</label>
                  <input id="discount" type="number" class="input-field" formControlName="discountPercent" />
                </div>
              </div>
              @if (previewOfferPrice > 0) {
                <div class="rounded-xl bg-teal-50 px-4 py-3 text-sm">
                  <p class="text-[var(--color-muted)]">Offer price (auto)</p>
                  <p class="mt-1 flex flex-wrap items-baseline gap-2">
                    <span class="text-lg font-bold text-teal-800">{{ formatPrice(previewOfferPrice) }}</span>
                    <span class="text-[var(--color-muted)] line-through">{{
                      formatPrice(previewOriginalPrice)
                    }}</span>
                    <span class="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-white"
                      >-{{ offerForm.controls.discountPercent.value }}%</span
                    >
                  </p>
                </div>
              }
              <div>
                <label class="mb-1 block text-sm font-medium" for="coupon">Coupon</label>
                <input id="coupon" class="input-field" formControlName="couponCode" placeholder="SAVE20" />
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
                  [accept]="acceptedImageAccept"
                  class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                  (change)="onOfferImageSelected($event)"
                />
                <p class="mt-1 text-xs text-[var(--color-muted)]">{{ imageUploadHint }}</p>
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
                            <button type="button" class="btn-secondary btn-compact" (click)="setStatus(row.id, 'ACTIVE')">
                              Publish
                            </button>
                            <button type="button" class="btn-secondary btn-compact" (click)="setStatus(row.id, 'DRAFT')">
                              Draft
                            </button>
                            <label class="btn-secondary btn-compact !mb-0" [title]="imageUploadHint">
                              <input
                                type="file"
                                [accept]="acceptedImageAccept"
                                class="sr-only"
                                (change)="uploadImageForOffer(row.id, $event)"
                              />
                              {{ uploadingOfferImageId === row.id ? 'Uploading…' : 'Image' }}
                            </label>
                            <button type="button" class="btn-secondary btn-compact !text-red-700" (click)="removeOffer(row.id)">
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

        @if (activeTab === 'services') {
          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <form class="surface-panel space-y-4" [formGroup]="serviceForm" (ngSubmit)="createService()">
              <h2 class="font-display text-xl font-semibold text-teal-900">Create service</h2>
              <div>
                <label class="mb-1 block text-sm font-medium" for="serviceTitle">Title</label>
                <input id="serviceTitle" class="input-field" formControlName="title" placeholder="Haircut / AC repair" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="serviceDesc">Description</label>
                <textarea id="serviceDesc" rows="3" class="input-field" formControlName="description"></textarea>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium" for="servicePrice">Price (LKR)</label>
                  <input id="servicePrice" type="number" min="0" step="0.01" class="input-field" formControlName="price" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium" for="serviceUnit">Price unit</label>
                  <select id="serviceUnit" class="input-field" formControlName="priceUnit">
                    <option value="FIXED">Fixed</option>
                    <option value="FROM">From</option>
                    <option value="HOURLY">Per hour</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="serviceStatus">Status</label>
                <select id="serviceStatus" class="input-field" formControlName="status">
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active (live)</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="serviceImage">Image</label>
                <input
                  id="serviceImage"
                  type="file"
                  [accept]="acceptedImageAccept"
                  class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                  (change)="onServiceImageSelected($event)"
                />
                @if (serviceImagePreview) {
                  <img [src]="serviceImagePreview" alt="Service preview" class="mt-3 h-28 w-full max-w-xs rounded-xl object-cover" />
                }
              </div>
              @if (serviceMessage) {
                <p class="text-sm font-medium text-teal-700">{{ serviceMessage }}</p>
              }
              @if (serviceError) {
                <p class="text-sm text-red-700">{{ serviceError }}</p>
              }
              <button type="submit" class="btn-primary" [disabled]="serviceForm.invalid || savingService">
                {{ savingService ? 'Saving…' : 'Create service' }}
              </button>
            </form>

            <div class="surface-panel overflow-x-auto">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-display text-xl font-semibold text-teal-900">Manage services</h2>
                <button type="button" class="text-sm font-semibold text-teal-700 hover:underline" (click)="reloadServices()">
                  Refresh
                </button>
              </div>
              @if (!managedServices.length) {
                <p class="mt-4 text-sm text-[var(--color-muted)]">No services yet.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (row of managedServices; track row.id) {
                    <li class="rounded-xl border border-teal-50 px-4 py-3 text-sm">
                      <div class="flex flex-wrap items-start gap-3">
                        @if (row.imageUrl) {
                          <img [src]="row.imageUrl" [alt]="row.title" class="h-14 w-14 rounded-lg object-cover" />
                        }
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <a [routerLink]="['/services', row.id]" class="font-semibold text-teal-900 hover:underline">
                                {{ row.title }}
                              </a>
                              @if (row.price != null) {
                                <p class="text-[var(--color-muted)]">{{ formatPrice(row.price) }} · {{ row.priceUnit }}</p>
                              }
                            </div>
                            <span class="chip">{{ row.status }}</span>
                          </div>
                          <div class="mt-3 flex flex-wrap gap-2">
                            <button type="button" class="btn-secondary btn-compact" (click)="setServiceStatus(row.id, 'ACTIVE')">
                              Publish
                            </button>
                            <button type="button" class="btn-secondary btn-compact" (click)="setServiceStatus(row.id, 'DRAFT')">
                              Draft
                            </button>
                            <label class="btn-secondary btn-compact !mb-0">
                              <input
                                type="file"
                                [accept]="acceptedImageAccept"
                                class="sr-only"
                                (change)="uploadImageForService(row.id, $event)"
                              />
                              {{ uploadingServiceImageId === row.id ? 'Uploading…' : 'Image' }}
                            </label>
                            <button
                              type="button"
                              class="btn-secondary btn-compact !text-red-700"
                              (click)="removeService(row.id)"
                            >
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

        @if (activeTab === 'rentals') {
          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <form class="surface-panel space-y-4" [formGroup]="rentalForm" (ngSubmit)="createRental()">
              <h2 class="font-display text-xl font-semibold text-teal-900">Create rental</h2>
              <div>
                <label class="mb-1 block text-sm font-medium" for="rentalTitle">Title</label>
                <input id="rentalTitle" class="input-field" formControlName="title" placeholder="Bike / Party hall" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="rentalDesc">Description</label>
                <textarea id="rentalDesc" rows="3" class="input-field" formControlName="description"></textarea>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium" for="rentalPrice">Price (LKR)</label>
                  <input id="rentalPrice" type="number" min="0" step="0.01" class="input-field" formControlName="price" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium" for="rentalUnit">Price unit</label>
                  <select id="rentalUnit" class="input-field" formControlName="priceUnit">
                    <option value="PER_DAY">Per day</option>
                    <option value="PER_HOUR">Per hour</option>
                    <option value="FIXED">Fixed</option>
                    <option value="FROM">From</option>
                  </select>
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium" for="rentalDeposit">Deposit (LKR)</label>
                  <input id="rentalDeposit" type="number" min="0" step="0.01" class="input-field" formControlName="deposit" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium" for="rentalStatus">Status</label>
                  <select id="rentalStatus" class="input-field" formControlName="status">
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active (live)</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="rentalAvail">Availability note</label>
                <input
                  id="rentalAvail"
                  class="input-field"
                  formControlName="availabilityNote"
                  placeholder="Available weekdays 9am–6pm"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="rentalImage">Image</label>
                <input
                  id="rentalImage"
                  type="file"
                  [accept]="acceptedImageAccept"
                  class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                  (change)="onRentalImageSelected($event)"
                />
                @if (rentalImagePreview) {
                  <img [src]="rentalImagePreview" alt="Rental preview" class="mt-3 h-28 w-full max-w-xs rounded-xl object-cover" />
                }
              </div>
              @if (rentalMessage) {
                <p class="text-sm font-medium text-teal-700">{{ rentalMessage }}</p>
              }
              @if (rentalError) {
                <p class="text-sm text-red-700">{{ rentalError }}</p>
              }
              <button type="submit" class="btn-primary" [disabled]="rentalForm.invalid || savingRental">
                {{ savingRental ? 'Saving…' : 'Create rental' }}
              </button>
            </form>

            <div class="surface-panel overflow-x-auto">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-display text-xl font-semibold text-teal-900">Manage rentals</h2>
                <button type="button" class="text-sm font-semibold text-teal-700 hover:underline" (click)="reloadRentals()">
                  Refresh
                </button>
              </div>
              @if (!managedRentals.length) {
                <p class="mt-4 text-sm text-[var(--color-muted)]">No rentals yet.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (row of managedRentals; track row.id) {
                    <li class="rounded-xl border border-teal-50 px-4 py-3 text-sm">
                      <div class="flex flex-wrap items-start gap-3">
                        @if (row.imageUrl) {
                          <img [src]="row.imageUrl" [alt]="row.title" class="h-14 w-14 rounded-lg object-cover" />
                        }
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <a [routerLink]="['/rentals', row.id]" class="font-semibold text-teal-900 hover:underline">
                                {{ row.title }}
                              </a>
                              @if (row.price != null) {
                                <p class="text-[var(--color-muted)]">{{ formatPrice(row.price) }} · {{ row.priceUnit }}</p>
                              }
                            </div>
                            <span class="chip">{{ row.status }}</span>
                          </div>
                          <div class="mt-3 flex flex-wrap gap-2">
                            <button type="button" class="btn-secondary btn-compact" (click)="setRentalStatus(row.id, 'ACTIVE')">
                              Publish
                            </button>
                            <button type="button" class="btn-secondary btn-compact" (click)="setRentalStatus(row.id, 'DRAFT')">
                              Draft
                            </button>
                            <label class="btn-secondary btn-compact !mb-0">
                              <input
                                type="file"
                                [accept]="acceptedImageAccept"
                                class="sr-only"
                                (change)="uploadImageForRental(row.id, $event)"
                              />
                              {{ uploadingRentalImageId === row.id ? 'Uploading…' : 'Image' }}
                            </label>
                            <button
                              type="button"
                              class="btn-secondary btn-compact !text-red-700"
                              (click)="removeRental(row.id)"
                            >
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

        @if (activeTab === 'pos') {
          @if (!business?.posEnabled) {
            <div class="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
              <p class="font-semibold text-amber-950">Shopper POS upgrade</p>
              <p class="mt-1">Ask a system admin to enable POS for your shop under Admin → Shops.</p>
            </div>
          } @else {
            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-700 to-teal-900 px-4 py-4 text-white">
                <p class="text-xs font-semibold uppercase tracking-wide text-teal-100">Today sales</p>
                <p class="mt-1 font-display text-3xl font-semibold">{{ posSummary?.saleCount ?? 0 }}</p>
              </div>
              <div class="rounded-2xl border border-teal-100 bg-white px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-teal-600">Today revenue</p>
                <p class="mt-1 font-display text-2xl font-semibold text-teal-900">
                  {{ formatPrice(posSummary?.revenue ?? 0) }}
                </p>
              </div>
              <div class="rounded-2xl border border-teal-100 bg-white px-4 py-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-teal-600">In cart</p>
                <p class="mt-1 font-display text-2xl font-semibold text-teal-900">
                  {{ cartItemCount }} · {{ formatPrice(cartTotal) }}
                </p>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div class="inline-flex rounded-xl bg-teal-50 p-1">
                @for (sub of posSubTabs; track sub.id) {
                  <button
                    type="button"
                    class="rounded-lg px-4 py-2 text-sm font-semibold transition"
                    [class.bg-white]="posSubTab === sub.id"
                    [class.text-teal-900]="posSubTab === sub.id"
                    [class.shadow-sm]="posSubTab === sub.id"
                    [class.text-teal-700]="posSubTab !== sub.id"
                    (click)="posSubTab = sub.id"
                  >
                    {{ sub.label }}
                  </button>
                }
              </div>
              <button type="button" class="text-sm font-semibold text-teal-700 hover:underline" (click)="reloadPos()">
                Refresh
              </button>
            </div>

            @if (posSubTab === 'counter') {
              <div class="mt-5 grid gap-6 xl:grid-cols-5">
                <div class="surface-panel xl:col-span-3">
                  <div class="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 class="font-display text-xl font-semibold text-teal-900">Sell</h2>
                      <p class="text-sm text-[var(--color-muted)]">Tap a product to add it to the cart</p>
                    </div>
                    <input
                      type="search"
                      class="input-field max-w-xs"
                      placeholder="Search products…"
                      [value]="posProductSearch"
                      (input)="posProductSearch = $any($event.target).value"
                    />
                  </div>
                  @if (!activePosProducts.length) {
                    <div class="mt-8 rounded-xl border border-dashed border-teal-200 px-4 py-10 text-center">
                      <mat-icon class="!text-4xl text-teal-300">point_of_sale</mat-icon>
                      <p class="mt-2 text-sm text-[var(--color-muted)]">No active products yet. Add some in the Products tab.</p>
                      <button type="button" class="btn-secondary mt-4" (click)="posSubTab = 'products'">Go to Products</button>
                    </div>
                  } @else if (!filteredActivePosProducts.length) {
                    <p class="mt-8 text-center text-sm text-[var(--color-muted)]">No products match “{{ posProductSearch }}”.</p>
                  } @else {
                    <ul class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      @for (product of filteredActivePosProducts; track product.id) {
                        <li>
                          <button
                            type="button"
                            class="group w-full overflow-hidden rounded-2xl border border-teal-100 bg-white text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                            [disabled]="product.stock === 0"
                            [class.opacity-50]="product.stock === 0"
                            (click)="addToCart(product)"
                          >
                            <div class="relative aspect-[4/3] bg-teal-50">
                              @if (product.imageUrl) {
                                <img
                                  [src]="product.imageUrl"
                                  [alt]="product.name"
                                  class="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                />
                              } @else {
                                <div class="flex h-full w-full items-center justify-center text-teal-300">
                                  <mat-icon class="!text-5xl">inventory_2</mat-icon>
                                </div>
                              }
                              <span class="absolute bottom-2 right-2 rounded-lg bg-teal-900/90 px-2 py-1 text-xs font-semibold text-white">
                                {{ formatPrice(product.price) }}
                              </span>
                            </div>
                            <div class="px-3 py-3">
                              <p class="truncate font-semibold text-teal-900">{{ product.name }}</p>
                              <p class="mt-0.5 text-xs text-[var(--color-muted)]">
                                @if (product.stock == null) {
                                  Unlimited
                                } @else if (product.stock === 0) {
                                  Out of stock
                                } @else {
                                  Stock {{ product.stock }}
                                }
                                @if (product.sku) {
                                  · {{ product.sku }}
                                }
                              </p>
                            </div>
                          </button>
                        </li>
                      }
                    </ul>
                  }
                </div>

                <div class="surface-panel flex flex-col space-y-4 xl:col-span-2 xl:sticky xl:top-4 xl:self-start">
                  <div class="flex items-center justify-between gap-2">
                    <h2 class="font-display text-xl font-semibold text-teal-900">Cart</h2>
                    @if (posCart.length) {
                      <button type="button" class="text-xs font-semibold text-red-600 hover:underline" (click)="clearPosCart()">
                        Clear
                      </button>
                    }
                  </div>
                  @if (!posCart.length) {
                    <div class="rounded-xl border border-dashed border-teal-200 px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                      Cart is empty — tap products to start a sale.
                    </div>
                  } @else {
                    <ul class="max-h-72 space-y-2 overflow-y-auto pr-1">
                      @for (line of posCart; track line.product.id) {
                        <li class="flex items-center gap-3 rounded-xl border border-teal-50 bg-teal-50/40 px-3 py-2 text-sm">
                          <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-teal-100">
                            @if (line.product.imageUrl) {
                              <img [src]="line.product.imageUrl" [alt]="line.product.name" class="h-full w-full object-cover" />
                            } @else {
                              <div class="flex h-full w-full items-center justify-center text-teal-400">
                                <mat-icon class="!text-xl">inventory_2</mat-icon>
                              </div>
                            }
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="truncate font-medium text-teal-900">{{ line.product.name }}</p>
                            <p class="text-[var(--color-muted)]">
                              {{ formatPrice(line.product.price) }} · {{ formatPrice(line.product.price * line.quantity) }}
                            </p>
                          </div>
                          <div class="flex items-center gap-1">
                            <button type="button" class="btn-secondary btn-compact" (click)="changeCartQty(line.product.id, -1)">−</button>
                            <span class="w-7 text-center font-semibold">{{ line.quantity }}</span>
                            <button type="button" class="btn-secondary btn-compact" (click)="changeCartQty(line.product.id, 1)">+</button>
                          </div>
                        </li>
                      }
                    </ul>
                  }

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm font-medium" for="posDiscount">Discount (LKR)</label>
                      <input
                        id="posDiscount"
                        type="number"
                        min="0"
                        step="0.01"
                        class="input-field"
                        [value]="posDiscount"
                        (input)="posDiscount = +$any($event.target).value || 0"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium" for="posPay">Payment</label>
                      <select
                        id="posPay"
                        class="input-field"
                        [value]="posPaymentMethod"
                        (change)="posPaymentMethod = $any($event.target).value"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <div class="rounded-2xl bg-teal-900 px-4 py-3 text-sm text-teal-50">
                    <div class="flex justify-between text-teal-200"><span>Subtotal</span><span>{{ formatPrice(cartSubtotal) }}</span></div>
                    @if (posDiscount > 0) {
                      <div class="mt-1 flex justify-between text-teal-200"><span>Discount</span><span>-{{ formatPrice(posDiscount) }}</span></div>
                    }
                    <div class="mt-2 flex justify-between font-display text-xl font-semibold text-white">
                      <span>Total</span><span>{{ formatPrice(cartTotal) }}</span>
                    </div>
                  </div>
                  @if (posCheckoutMessage) {
                    <p class="rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">{{ posCheckoutMessage }}</p>
                  }
                  @if (posCheckoutError) {
                    <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ posCheckoutError }}</p>
                  }
                  <button
                    type="button"
                    class="btn-primary w-full !py-3"
                    [disabled]="!posCart.length || checkingOut"
                    (click)="checkoutPos()"
                  >
                    {{ checkingOut ? 'Processing…' : 'Complete sale' }}
                  </button>
                </div>
              </div>
            }

            @if (posSubTab === 'products') {
              <div class="mt-5 grid gap-6 lg:grid-cols-2">
                <form class="surface-panel space-y-4" [formGroup]="posProductForm" (ngSubmit)="createPosProduct()">
                  <div>
                    <h2 class="font-display text-xl font-semibold text-teal-900">Add product</h2>
                    <p class="text-sm text-[var(--color-muted)]">Name, price, optional stock and photo</p>
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium" for="posProdName">Name</label>
                    <input id="posProdName" class="input-field" formControlName="name" placeholder="Tea / Shirt / Service fee" />
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm font-medium" for="posProdSku">SKU</label>
                      <input id="posProdSku" class="input-field" formControlName="sku" placeholder="Optional" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium" for="posProdPrice">Price (LKR)</label>
                      <input id="posProdPrice" type="number" min="0" step="0.01" class="input-field" formControlName="price" />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium" for="posProdStock">Stock (empty = unlimited)</label>
                    <input id="posProdStock" type="number" min="0" step="1" class="input-field" formControlName="stock" />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium" for="posProdImage">Product image</label>
                    <input
                      id="posProdImage"
                      type="file"
                      [accept]="acceptedImageAccept"
                      class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                      (change)="onPosImageSelected($event)"
                    />
                    @if (posImagePreview) {
                      <img [src]="posImagePreview" alt="Product preview" class="mt-3 h-32 w-full max-w-xs rounded-xl object-cover ring-1 ring-teal-100" />
                    }
                  </div>
                  @if (posProductMessage) {
                    <p class="text-sm font-medium text-teal-700">{{ posProductMessage }}</p>
                  }
                  @if (posProductError) {
                    <p class="text-sm text-red-700">{{ posProductError }}</p>
                  }
                  <button type="submit" class="btn-primary" [disabled]="posProductForm.invalid || savingPosProduct">
                    {{ savingPosProduct ? 'Saving…' : 'Save product' }}
                  </button>
                </form>

                <div class="surface-panel">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <h2 class="font-display text-xl font-semibold text-teal-900">Catalog</h2>
                      <p class="text-sm text-[var(--color-muted)]">{{ posProducts.length }} products</p>
                    </div>
                  </div>
                  @if (!posProducts.length) {
                    <p class="mt-6 text-sm text-[var(--color-muted)]">No POS products yet.</p>
                  } @else {
                    <ul class="mt-4 space-y-3">
                      @for (product of posProducts; track product.id) {
                        <li class="rounded-2xl border border-teal-50 px-3 py-3 text-sm">
                          <div class="flex gap-3">
                            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-teal-50">
                              @if (product.imageUrl) {
                                <img [src]="product.imageUrl" [alt]="product.name" class="h-full w-full object-cover" />
                              } @else {
                                <div class="flex h-full w-full items-center justify-center text-teal-300">
                                  <mat-icon>image</mat-icon>
                                </div>
                              }
                            </div>
                            <div class="min-w-0 flex-1">
                              <div class="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p class="font-semibold text-teal-900">{{ product.name }}</p>
                                  <p class="text-[var(--color-muted)]">
                                    {{ formatPrice(product.price) }}
                                    @if (product.sku) {
                                      · {{ product.sku }}
                                    }
                                    · {{ product.stock == null ? 'Unlimited' : 'Stock ' + product.stock }}
                                  </p>
                                </div>
                                <span class="chip">{{ product.isActive ? 'active' : 'inactive' }}</span>
                              </div>
                              <div class="mt-2 flex flex-wrap gap-2">
                                <button type="button" class="btn-secondary btn-compact" (click)="togglePosProduct(product)">
                                  {{ product.isActive ? 'Deactivate' : 'Activate' }}
                                </button>
                                <label class="btn-secondary btn-compact !mb-0">
                                  <input
                                    type="file"
                                    [accept]="acceptedImageAccept"
                                    class="sr-only"
                                    (change)="uploadImageForPosProduct(product.id, $event)"
                                  />
                                  {{ uploadingPosImageId === product.id ? 'Uploading…' : 'Image' }}
                                </label>
                                <button
                                  type="button"
                                  class="btn-secondary btn-compact !text-red-700"
                                  (click)="removePosProduct(product.id)"
                                >
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

            @if (posSubTab === 'sales') {
              <div class="mt-5 surface-panel">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h2 class="font-display text-xl font-semibold text-teal-900">Sales history</h2>
                    <p class="text-sm text-[var(--color-muted)]">Recent POS receipts</p>
                  </div>
                </div>
                @if (!posSales.length) {
                  <div class="mt-8 rounded-xl border border-dashed border-teal-200 px-4 py-10 text-center text-sm text-[var(--color-muted)]">
                    No sales yet. Complete a checkout from the Counter.
                  </div>
                } @else {
                  <ul class="mt-4 divide-y divide-teal-50">
                    @for (sale of posSales; track sale.id) {
                      <li class="flex flex-wrap items-start justify-between gap-3 py-4 text-sm first:pt-0">
                        <div>
                          <p class="font-semibold text-teal-900">{{ sale.receiptNumber }}</p>
                          <p class="text-[var(--color-muted)]">
                            {{ sale.createdDate | date: 'medium' }} · {{ sale.paymentMethod }}
                            @if (sale.items?.length) {
                              · {{ sale.items!.length }} items
                            }
                          </p>
                          @if (sale.items?.length) {
                            <p class="mt-1 text-xs text-teal-700/80">
                              {{ saleItemPreview(sale) }}
                            </p>
                          }
                        </div>
                        <p class="font-display text-lg font-semibold text-teal-800">{{ formatPrice(sale.total) }}</p>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          }
        }
      }
    </div>
  `,
})
export class BusinessDashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly businessApi = inject(BusinessService);
  private readonly shopServicesApi = inject(ShopServicesService);
  private readonly rentalsApi = inject(RentalsService);
  private readonly posApi = inject(PosService);
  private readonly locations = inject(LocationsService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  activeTab: Tab = 'overview';
  posSubTab: PosSubTab = 'counter';
  justRegistered = false;
  tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'stores', label: 'Shops' },
    { id: 'offers', label: 'Offers' },
    { id: 'services', label: 'Services' },
    { id: 'rentals', label: 'Rentals' },
    { id: 'pos', label: 'POS' },
  ];
  posSubTabs: { id: PosSubTab; label: string }[] = [
    { id: 'counter', label: 'Counter' },
    { id: 'products', label: 'Products' },
    { id: 'sales', label: 'Sales' },
  ];

  stats?: DashboardStats;
  rows: DashboardOfferRow[] = [];
  managedOffers: DashboardOfferRow[] = [];
  managedServices: ManagedListingRow[] = [];
  managedRentals: ManagedListingRow[] = [];
  posProducts: PosProduct[] = [];
  posSales: PosSale[] = [];
  posCart: PosCartLine[] = [];
  posSummary: PosTodaySummary | null = null;
  posDiscount = 0;
  posPaymentMethod: PosPaymentMethod = 'CASH';
  posProductSearch = '';
  business?: BusinessProfile;
  cities: City[] = [];
  loading = true;
  error = '';
  cards: { label: string; value: string }[] = [];

  savingStore = false;
  storeMessage = '';
  storeError = '';
  savingOffer = false;
  offerMessage = '';
  offerError = '';
  savingService = false;
  serviceMessage = '';
  serviceError = '';
  savingRental = false;
  rentalMessage = '';
  rentalError = '';
  savingProfile = false;
  profileMessage = '';
  profileError = '';
  savingPosProduct = false;
  posProductMessage = '';
  posProductError = '';
  checkingOut = false;
  posCheckoutMessage = '';
  posCheckoutError = '';

  storeLogoFile: File | null = null;
  storeLogoPreview = '';
  offerImageFile: File | null = null;
  offerImagePreview = '';
  serviceImageFile: File | null = null;
  serviceImagePreview = '';
  rentalImageFile: File | null = null;
  rentalImagePreview = '';
  posImageFile: File | null = null;
  posImagePreview = '';
  uploadingLogoId = '';
  uploadingOfferImageId = '';
  uploadingServiceImageId = '';
  uploadingRentalImageId = '';
  uploadingPosImageId = '';
  readonly acceptedImageAccept = ACCEPTED_IMAGE_ACCEPT;
  readonly imageUploadHint = IMAGE_UPLOAD_HINT;

  storeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    cityId: ['', Validators.required],
    address: [''],
    locationUrl: [''],
    phone: [''],
    description: [''],
  });

  profileForm = this.fb.nonNullable.group({
    website: [''],
    instagramUrl: [''],
    facebookUrl: [''],
  });

  offerForm = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    description: this.fb.nonNullable.control(''),
    originalPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
    discountPercent: this.fb.nonNullable.control(20, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    startDate: this.fb.nonNullable.control(this.today(), Validators.required),
    endDate: this.fb.nonNullable.control(this.plusDays(30), Validators.required),
    couponCode: this.fb.nonNullable.control(''),
    status: this.fb.nonNullable.control('ACTIVE' as const, Validators.required),
  });

  serviceForm = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    description: this.fb.nonNullable.control(''),
    price: this.fb.control<number | null>(null, [Validators.min(0)]),
    priceUnit: this.fb.nonNullable.control('FIXED'),
    status: this.fb.nonNullable.control('ACTIVE'),
  });

  rentalForm = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    description: this.fb.nonNullable.control(''),
    price: this.fb.control<number | null>(null, [Validators.min(0)]),
    priceUnit: this.fb.nonNullable.control('PER_DAY'),
    deposit: this.fb.control<number | null>(null, [Validators.min(0)]),
    availabilityNote: this.fb.nonNullable.control(''),
    status: this.fb.nonNullable.control('ACTIVE'),
  });

  posProductForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(1)]),
    sku: this.fb.nonNullable.control(''),
    price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    stock: this.fb.control<number | null>(null, [Validators.min(0)]),
  });

  get visibleTabs(): { id: Tab; label: string }[] {
    if (this.business?.posEnabled) return this.tabs;
    return this.tabs.filter((t) => t.id !== 'pos');
  }

  get activePosProducts(): PosProduct[] {
    return this.posProducts.filter((p) => p.isActive);
  }

  get filteredActivePosProducts(): PosProduct[] {
    const q = this.posProductSearch.trim().toLowerCase();
    if (!q) return this.activePosProducts;
    return this.activePosProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q),
    );
  }

  get cartItemCount(): number {
    return this.posCart.reduce((sum, line) => sum + line.quantity, 0);
  }

  get cartSubtotal(): number {
    return this.posCart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  }

  get cartTotal(): number {
    return Math.max(0, this.cartSubtotal - (Number(this.posDiscount) || 0));
  }

  get previewOriginalPrice(): number {
    return Number(this.offerForm.controls.originalPrice.value) || 0;
  }

  get previewOfferPrice(): number {
    const percent = Number(this.offerForm.controls.discountPercent.value);
    return offerPriceFrom(this.previewOriginalPrice, percent);
  }

  formatPrice(amount: number): string {
    return formatLkr(amount);
  }

  ngOnInit(): void {
    this.justRegistered = this.route.snapshot.queryParamMap.get('registered') === '1';
    this.locations.getCities().subscribe((cities) => (this.cities = cities));
    this.reloadAll();
  }

  cityLabel(city: City): string {
    const district = city.district?.name;
    return district ? `${city.name} — ${district}` : city.name;
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
    this.reloadServices();
    this.reloadRentals();
    this.businessApi.getMine().subscribe({
      next: (biz) => {
        this.business = biz;
        this.profileForm.patchValue({
          website: biz.website || '',
          instagramUrl: biz.instagramUrl || '',
          facebookUrl: biz.facebookUrl || '',
        });
        if (biz.posEnabled) {
          this.reloadPos();
        } else if (this.activeTab === 'pos') {
          this.activeTab = 'overview';
        }
      },
      error: () => (this.business = undefined),
    });
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'pos' && this.business?.posEnabled) {
      this.reloadPos();
    }
  }

  reloadPos(): void {
    if (!this.business?.posEnabled) return;
    this.posApi.getProducts().subscribe({
      next: (rows) => (this.posProducts = rows),
      error: () => (this.posProducts = []),
    });
    this.posApi.getSales().subscribe({
      next: (rows) => (this.posSales = rows),
      error: () => (this.posSales = []),
    });
    this.posApi.getTodaySummary().subscribe({
      next: (summary) => (this.posSummary = summary),
      error: () => (this.posSummary = null),
    });
  }

  createPosProduct(): void {
    if (this.posProductForm.invalid) return;
    this.savingPosProduct = true;
    this.posProductMessage = '';
    this.posProductError = '';
    const value = this.posProductForm.getRawValue();
    const stockValue = value.stock;
    this.posApi
      .createWithImage(
        {
          name: value.name,
          sku: value.sku || undefined,
          price: Number(value.price) || 0,
          stock: stockValue == null || Number.isNaN(Number(stockValue)) ? null : Number(stockValue),
        },
        this.posImageFile,
      )
      .subscribe({
        next: () => {
          this.savingPosProduct = false;
          this.posProductMessage = 'Product saved.';
          this.posProductForm.reset({ name: '', sku: '', price: 0, stock: null });
          if (this.posImagePreview) URL.revokeObjectURL(this.posImagePreview);
          this.posImageFile = null;
          this.posImagePreview = '';
          this.reloadPos();
        },
        error: (err: Error) => {
          this.savingPosProduct = false;
          this.posProductError = err.message || 'Could not save product';
        },
      });
  }

  onPosImageSelected(event: Event): void {
    const file = this.pickValidImage(event, 'pos');
    if (this.posImagePreview) URL.revokeObjectURL(this.posImagePreview);
    this.posImageFile = file;
    this.posImagePreview = file ? URL.createObjectURL(file) : '';
  }

  uploadImageForPosProduct(id: string, event: Event): void {
    const file = this.pickValidImage(event, 'pos');
    if (!file) return;
    this.uploadingPosImageId = id;
    this.posProductError = '';
    this.posApi.uploadImage(id, file).subscribe({
      next: () => {
        this.uploadingPosImageId = '';
        this.posProductMessage = 'Product image updated.';
        this.reloadPos();
      },
      error: (err: Error) => {
        this.uploadingPosImageId = '';
        this.posProductError = err.message || 'Could not upload product image.';
      },
    });
  }

  clearPosCart(): void {
    this.posCart = [];
    this.posCheckoutError = '';
  }

  saleItemPreview(sale: PosSale): string {
    const names = (sale.items || []).map((i) => `${i.productName}×${i.quantity}`);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  }

  togglePosProduct(product: PosProduct): void {
    this.posApi.updateProduct(product.id, { isActive: !product.isActive }).subscribe({
      next: () => this.reloadPos(),
      error: (err: Error) => (this.posProductError = err.message || 'Could not update product'),
    });
  }

  removePosProduct(id: string): void {
    this.posApi.deleteProduct(id).subscribe({
      next: () => {
        this.posCart = this.posCart.filter((line) => line.product.id !== id);
        this.reloadPos();
      },
      error: (err: Error) => (this.posProductError = err.message || 'Could not delete product'),
    });
  }

  addToCart(product: PosProduct): void {
    if (product.stock === 0) {
      this.posCheckoutError = `"${product.name}" is out of stock`;
      return;
    }
    const existing = this.posCart.find((line) => line.product.id === product.id);
    if (existing) {
      if (product.stock != null && existing.quantity >= product.stock) {
        this.posCheckoutError = `Only ${product.stock} available for "${product.name}"`;
        return;
      }
      existing.quantity += 1;
      this.posCart = [...this.posCart];
    } else {
      this.posCart = [...this.posCart, { product, quantity: 1 }];
    }
    this.posCheckoutError = '';
  }

  changeCartQty(productId: string, delta: number): void {
    this.posCart = this.posCart
      .map((line) => {
        if (line.product.id !== productId) return line;
        const next = line.quantity + delta;
        if (line.product.stock != null && next > line.product.stock) return line;
        return { ...line, quantity: next };
      })
      .filter((line) => line.quantity > 0);
  }

  checkoutPos(): void {
    if (!this.posCart.length) return;
    this.checkingOut = true;
    this.posCheckoutMessage = '';
    this.posCheckoutError = '';
    this.posApi
      .createSale({
        items: this.posCart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
        paymentMethod: this.posPaymentMethod,
        discount: Number(this.posDiscount) || 0,
      })
      .subscribe({
        next: (sale) => {
          this.checkingOut = false;
          this.posCheckoutMessage = `Sale complete — ${sale.receiptNumber}`;
          this.posCart = [];
          this.posDiscount = 0;
          this.reloadPos();
        },
        error: (err: Error) => {
          this.checkingOut = false;
          this.posCheckoutError = err.message || 'Checkout failed';
        },
      });
  }

  reloadOffers(): void {
    this.businessApi.getManagedOffers().subscribe({
      next: (rows) => (this.managedOffers = rows),
      error: () => (this.managedOffers = []),
    });
  }

  reloadServices(): void {
    this.shopServicesApi.getManaged().subscribe({
      next: (rows) => (this.managedServices = rows),
      error: () => (this.managedServices = []),
    });
  }

  reloadRentals(): void {
    this.rentalsApi.getManaged().subscribe({
      next: (rows) => (this.managedRentals = rows),
      error: () => (this.managedRentals = []),
    });
  }

  onStoreLogoSelected(event: Event): void {
    const file = this.pickValidImage(event, 'store');
    if (this.storeLogoPreview) URL.revokeObjectURL(this.storeLogoPreview);
    this.storeLogoFile = file;
    this.storeLogoPreview = file ? URL.createObjectURL(file) : '';
  }

  onOfferImageSelected(event: Event): void {
    const file = this.pickValidImage(event, 'offer');
    if (this.offerImagePreview) URL.revokeObjectURL(this.offerImagePreview);
    this.offerImageFile = file;
    this.offerImagePreview = file ? URL.createObjectURL(file) : '';
  }

  onServiceImageSelected(event: Event): void {
    const file = this.pickValidImage(event, 'service');
    if (this.serviceImagePreview) URL.revokeObjectURL(this.serviceImagePreview);
    this.serviceImageFile = file;
    this.serviceImagePreview = file ? URL.createObjectURL(file) : '';
  }

  onRentalImageSelected(event: Event): void {
    const file = this.pickValidImage(event, 'rental');
    if (this.rentalImagePreview) URL.revokeObjectURL(this.rentalImagePreview);
    this.rentalImageFile = file;
    this.rentalImagePreview = file ? URL.createObjectURL(file) : '';
  }

  saveProfile(): void {
    if (!this.business?.id) return;
    this.savingProfile = true;
    this.profileMessage = '';
    this.profileError = '';
    const value = this.profileForm.getRawValue();
    this.businessApi
      .updateShop(this.business.id, {
        website: externalHref(value.website) ?? '',
        instagramUrl: externalHref(value.instagramUrl) ?? '',
        facebookUrl: externalHref(value.facebookUrl) ?? '',
      })
      .subscribe({
        next: () => {
          this.savingProfile = false;
          this.profileMessage = 'Social links saved.';
          this.reloadAll();
        },
        error: (err: Error) => {
          this.savingProfile = false;
          this.profileError = err.message || 'Could not save social links.';
        },
      });
  }

  hrefOf(url?: string | null): string {
    return externalHref(url) || '#';
  }

  labelOf(url?: string | null): string {
    return displayUrl(url) || '';
  }

  createStore(): void {
    if (this.storeForm.invalid) return;
    this.savingStore = true;
    this.storeMessage = '';
    this.storeError = '';
    const value = this.storeForm.getRawValue();
    this.businessApi
      .createStoreWithLogo(
        {
          name: value.name,
          address: value.address || undefined,
          locationUrl: value.locationUrl || undefined,
          phone: value.phone || undefined,
          description: value.description || undefined,
          cityId: value.cityId || undefined,
        },
        this.storeLogoFile,
      )
      .subscribe({
      next: () => {
        this.savingStore = false;
        this.storeMessage = this.storeLogoFile ? 'Shop created with logo.' : 'Shop created.';
        this.storeForm.reset({
          name: '',
          cityId: '',
          address: '',
          locationUrl: '',
          phone: '',
          description: '',
        });
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
    const file = this.pickValidImage(event, 'store');
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
    const original = Number(value.originalPrice);
    this.businessApi
      .createOfferWithImage(
        {
          title: value.title,
          description: value.description || undefined,
          discountPercent: Number(value.discountPercent),
          originalPrice: Number.isFinite(original) && original > 0 ? original : undefined,
          startDate: value.startDate,
          endDate: value.endDate,
          couponCode: value.couponCode || undefined,
          status: value.status,
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
            originalPrice: null,
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

  createService(): void {
    if (this.serviceForm.invalid) return;
    this.savingService = true;
    this.serviceMessage = '';
    this.serviceError = '';
    const value = this.serviceForm.getRawValue();
    const price = Number(value.price);
    this.shopServicesApi
      .createWithImage(
        {
          title: value.title,
          description: value.description || undefined,
          price: Number.isFinite(price) && price > 0 ? price : undefined,
          priceUnit: value.priceUnit,
          status: value.status,
        },
        this.serviceImageFile,
      )
      .subscribe({
        next: (created) => {
          this.savingService = false;
          this.serviceMessage = `Service “${created.title}” created (${created.status}).`;
          this.serviceForm.patchValue({
            title: '',
            description: '',
            price: null,
            priceUnit: 'FIXED',
            status: 'ACTIVE',
          });
          this.clearServiceImage();
          this.reloadServices();
        },
        error: (err: Error) => {
          this.savingService = false;
          this.serviceError = err.message || 'Could not create service.';
        },
      });
  }

  createRental(): void {
    if (this.rentalForm.invalid) return;
    this.savingRental = true;
    this.rentalMessage = '';
    this.rentalError = '';
    const value = this.rentalForm.getRawValue();
    const price = Number(value.price);
    const deposit = Number(value.deposit);
    this.rentalsApi
      .createWithImage(
        {
          title: value.title,
          description: value.description || undefined,
          price: Number.isFinite(price) && price > 0 ? price : undefined,
          priceUnit: value.priceUnit,
          deposit: Number.isFinite(deposit) && deposit > 0 ? deposit : undefined,
          availabilityNote: value.availabilityNote || undefined,
          status: value.status,
        },
        this.rentalImageFile,
      )
      .subscribe({
        next: (created) => {
          this.savingRental = false;
          this.rentalMessage = `Rental “${created.title}” created (${created.status}).`;
          this.rentalForm.patchValue({
            title: '',
            description: '',
            price: null,
            priceUnit: 'PER_DAY',
            deposit: null,
            availabilityNote: '',
            status: 'ACTIVE',
          });
          this.clearRentalImage();
          this.reloadRentals();
        },
        error: (err: Error) => {
          this.savingRental = false;
          this.rentalError = err.message || 'Could not create rental.';
        },
      });
  }

  uploadImageForOffer(offerId: string, event: Event): void {
    const file = this.pickValidImage(event, 'offer');
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

  uploadImageForService(id: string, event: Event): void {
    const file = this.pickValidImage(event, 'service');
    if (!file) return;
    this.uploadingServiceImageId = id;
    this.serviceError = '';
    this.shopServicesApi.uploadImage(id, file).subscribe({
      next: () => {
        this.uploadingServiceImageId = '';
        this.serviceMessage = 'Service image updated.';
        this.reloadServices();
      },
      error: (err: Error) => {
        this.uploadingServiceImageId = '';
        this.serviceError = err.message || 'Could not upload service image.';
      },
    });
  }

  uploadImageForRental(id: string, event: Event): void {
    const file = this.pickValidImage(event, 'rental');
    if (!file) return;
    this.uploadingRentalImageId = id;
    this.rentalError = '';
    this.rentalsApi.uploadImage(id, file).subscribe({
      next: () => {
        this.uploadingRentalImageId = '';
        this.rentalMessage = 'Rental image updated.';
        this.reloadRentals();
      },
      error: (err: Error) => {
        this.uploadingRentalImageId = '';
        this.rentalError = err.message || 'Could not upload rental image.';
      },
    });
  }

  setStatus(id: string, status: string): void {
    this.businessApi.updateOfferStatus(id, status).subscribe({
      next: () => this.reloadAll(),
      error: () => (this.offerError = 'Could not update offer status.'),
    });
  }

  setServiceStatus(id: string, status: string): void {
    this.shopServicesApi.updateStatus(id, status).subscribe({
      next: () => this.reloadServices(),
      error: () => (this.serviceError = 'Could not update service status.'),
    });
  }

  setRentalStatus(id: string, status: string): void {
    this.rentalsApi.updateStatus(id, status).subscribe({
      next: () => this.reloadRentals(),
      error: () => (this.rentalError = 'Could not update rental status.'),
    });
  }

  removeOffer(id: string): void {
    this.businessApi.deleteOffer(id).subscribe({
      next: () => this.reloadAll(),
      error: () => (this.offerError = 'Could not delete offer.'),
    });
  }

  removeService(id: string): void {
    this.shopServicesApi.delete(id).subscribe({
      next: () => this.reloadServices(),
      error: () => (this.serviceError = 'Could not delete service.'),
    });
  }

  removeRental(id: string): void {
    this.rentalsApi.delete(id).subscribe({
      next: () => this.reloadRentals(),
      error: () => (this.rentalError = 'Could not delete rental.'),
    });
  }

  private pickValidImage(event: Event, target: ImageTarget): File | null {
    const file = fileFromInputEvent(event);
    if (!file) return null;
    const invalid = validateImageFile(file);
    if (invalid) {
      if (target === 'store') {
        this.storeError = invalid;
        this.storeMessage = '';
      } else if (target === 'offer') {
        this.offerError = invalid;
        this.offerMessage = '';
      } else if (target === 'service') {
        this.serviceError = invalid;
        this.serviceMessage = '';
      } else if (target === 'rental') {
        this.rentalError = invalid;
        this.rentalMessage = '';
      } else if (target === 'pos') {
        this.posProductError = invalid;
        this.posProductMessage = '';
      }
      return null;
    }
    if (target === 'store') this.storeError = '';
    else if (target === 'offer') this.offerError = '';
    else if (target === 'service') this.serviceError = '';
    else if (target === 'rental') this.rentalError = '';
    else if (target === 'pos') this.posProductError = '';
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

  private clearServiceImage(): void {
    if (this.serviceImagePreview) URL.revokeObjectURL(this.serviceImagePreview);
    this.serviceImageFile = null;
    this.serviceImagePreview = '';
  }

  private clearRentalImage(): void {
    if (this.rentalImagePreview) URL.revokeObjectURL(this.rentalImagePreview);
    this.rentalImageFile = null;
    this.rentalImagePreview = '';
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
