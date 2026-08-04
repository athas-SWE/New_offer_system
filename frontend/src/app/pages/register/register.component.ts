import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BusinessService } from '../../services/business.service';
import { City, LocationsService } from '../../services/locations.service';
import {
  ACCEPTED_IMAGE_ACCEPT,
  IMAGE_UPLOAD_HINT,
  fileFromInputEvent,
  validateImageFile,
} from '../../utils/image-upload';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell flex min-h-[70vh] items-center justify-center animate-fade-in">
      <div class="w-full max-w-2xl surface-panel">
        <img src="images/logo.png" alt="Offer Lanka" class="mx-auto mb-4 h-16 w-auto object-contain" />
        <p class="font-display text-3xl font-semibold text-teal-900">Register your shop</p>
        <p class="mt-2 text-sm text-[var(--color-muted)]">
          Submit your shop details for admin approval. After approval, your shop appears on the marketplace and you can publish offers.
        </p>

        <form class="mt-6 space-y-6" [formGroup]="form" (ngSubmit)="submit()">
          <section class="space-y-4">
            <h2 class="font-display text-lg font-semibold text-teal-900">Shop details</h2>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="shopName">Shop name</label>
              <input id="shopName" class="input-field" formControlName="name" placeholder="Colombo Fresh Mart" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="shopDesc">Description</label>
              <textarea
                id="shopDesc"
                rows="3"
                class="input-field"
                formControlName="description"
                placeholder="What you sell and where customers can find you"
              ></textarea>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-teal-900" for="shopPhone">Shop phone</label>
                <input id="shopPhone" class="input-field" formControlName="phone" placeholder="+94 77 000 0000" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-teal-900" for="regNo">Registration number</label>
                <input id="regNo" class="input-field" formControlName="registrationNumber" placeholder="Optional" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="cityId">City</label>
              <select id="cityId" class="input-field" formControlName="cityId">
                <option value="">Select a city</option>
                @for (city of cities; track city.id) {
                  <option [value]="city.id">
                    {{ cityLabel(city) }}
                  </option>
                }
              </select>
              @if (!cities.length) {
                <p class="mt-1 text-xs text-[var(--color-muted)]">Loading cities…</p>
              }
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="address">Address</label>
              <input id="address" class="input-field" formControlName="address" placeholder="Main Street, Kalmunai" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="locationUrl">
                Google Maps location URL
              </label>
              <input
                id="locationUrl"
                class="input-field"
                formControlName="locationUrl"
                placeholder="https://maps.google.com/?q=7.4167,81.8167"
              />
              <p class="mt-1 text-xs text-[var(--color-muted)]">
                Open Google Maps → Share → Copy link, then paste it here so customers can find your shop on the map.
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="logo">Shop logo (optional)</label>
              <input
                id="logo"
                type="file"
                [accept]="acceptedImageAccept"
                class="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
                (change)="onLogoSelected($event)"
              />
              <p class="mt-1 text-xs text-[var(--color-muted)]">{{ imageUploadHint }}</p>
              @if (logoPreview) {
                <img [src]="logoPreview" alt="Logo preview" class="mt-3 h-20 w-20 rounded-xl object-cover" />
              }
            </div>
          </section>

          <section class="space-y-4 border-t border-teal-50 pt-6">
            <h2 class="font-display text-lg font-semibold text-teal-900">Owner account</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-teal-900" for="ownerName">Full name</label>
                <input id="ownerName" class="input-field" formControlName="ownerName" placeholder="Your name" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-teal-900" for="ownerPhone">Phone</label>
                <input id="ownerPhone" class="input-field" formControlName="ownerPhone" placeholder="+94 77 000 0000" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="ownerEmail">Email</label>
              <input
                id="ownerEmail"
                type="email"
                class="input-field"
                formControlName="ownerEmail"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-teal-900" for="ownerPassword">Password</label>
              <input
                id="ownerPassword"
                type="password"
                class="input-field"
                formControlName="ownerPassword"
                placeholder="At least 8 characters"
              />
            </div>
          </section>

          @if (error) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
          }
          @if (success) {
            <p class="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-800">{{ success }}</p>
          }

          <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading">
            {{ loading ? 'Submitting…' : 'Submit shop for approval' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-[var(--color-muted)]">
          Already registered?
          <a routerLink="/login" class="font-semibold text-teal-700 hover:underline">Log in</a>
        </p>
        <p class="mt-2 text-center text-sm text-[var(--color-muted)]">
          Looking for deals?
          <a routerLink="/signup" class="font-semibold text-teal-700 hover:underline">Create a shopper account</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly shops = inject(BusinessService);
  private readonly locations = inject(LocationsService);
  private readonly router = inject(Router);

  loading = false;
  error = '';
  success = '';
  logoFile: File | null = null;
  logoPreview = '';
  cities: City[] = [];
  readonly acceptedImageAccept = ACCEPTED_IMAGE_ACCEPT;
  readonly imageUploadHint = IMAGE_UPLOAD_HINT;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    phone: [''],
    registrationNumber: [''],
    cityId: ['', Validators.required],
    address: [''],
    locationUrl: [''],
    ownerName: ['', [Validators.required, Validators.minLength(2)]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    ownerPassword: ['', [Validators.required, Validators.minLength(8)]],
    ownerPhone: [''],
  });

  ngOnInit(): void {
    this.locations.getCities().subscribe((cities) => (this.cities = cities));
  }

  cityLabel(city: City): string {
    const district = city.district?.name;
    return district ? `${city.name} — ${district}` : city.name;
  }

  onLogoSelected(event: Event): void {
    const file = fileFromInputEvent(event);
    if (this.logoPreview) URL.revokeObjectURL(this.logoPreview);
    if (!file) {
      this.logoFile = null;
      this.logoPreview = '';
      return;
    }
    const invalid = validateImageFile(file);
    if (invalid) {
      this.logoFile = null;
      this.logoPreview = '';
      this.error = invalid;
      return;
    }
    this.error = '';
    this.logoFile = file;
    this.logoPreview = URL.createObjectURL(file);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    const value = this.form.getRawValue();

    this.shops
      .registerShop({
        name: value.name,
        description: value.description || undefined,
        phone: value.phone || undefined,
        registrationNumber: value.registrationNumber || undefined,
        address: value.address || undefined,
        locationUrl: value.locationUrl || undefined,
        cityId: value.cityId || undefined,
        ownerName: value.ownerName,
        ownerEmail: value.ownerEmail,
        ownerPassword: value.ownerPassword,
        ownerPhone: value.ownerPhone || undefined,
      })
      .pipe(
        switchMap((shop) =>
          this.auth
            .login({
              email: value.ownerEmail,
              password: value.ownerPassword,
            })
            .pipe(
              switchMap(() => {
                if (!this.logoFile) return of(shop);
                return this.shops.uploadShopLogo(shop.id, this.logoFile).pipe(switchMap(() => of(shop)));
              }),
            ),
        ),
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = 'Shop submitted. Waiting for admin approval.';
          void this.router.navigate(['/business'], { queryParams: { registered: '1' } });
        },
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message || 'Registration failed';
        },
      });
  }
}
