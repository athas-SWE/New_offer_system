import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import {
  AdminBusiness,
  AdminCategory,
  AdminService,
  AdminUser,
} from '../../services/admin.service';
import { DashboardOfferRow, DashboardStats } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

type Tab = 'overview' | 'businesses' | 'offers' | 'categories' | 'users';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent, ReactiveFormsModule],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Admin dashboard</h1>
          <p class="section-sub">Moderate businesses, offers, categories and users.</p>
        </div>
        <button type="button" class="btn-secondary" (click)="reloadAll()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
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
            (click)="setTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (actionMessage) {
        <div class="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {{ actionMessage }}
        </div>
      }
      @if (actionError) {
        <div class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      }

      @if (loading) {
        <app-loading-spinner />
      } @else if (error) {
        <div class="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
      } @else {
        @if (activeTab === 'overview' && stats) {
          <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (card of cards; track card.label) {
              <div class="surface-panel border-t-4 border-t-teal-600">
                <p class="text-sm text-[var(--color-muted)]">{{ card.label }}</p>
                <p class="mt-2 font-display text-3xl font-semibold text-teal-900">{{ card.value }}</p>
              </div>
            }
          </div>

          <div class="mt-10 grid gap-6 lg:grid-cols-2">
            <div class="surface-panel">
              <h2 class="font-display text-xl font-semibold text-teal-900">Recent offers</h2>
              @if (!rows.length) {
                <p class="mt-4 text-sm text-[var(--color-muted)]">No offers yet.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (row of rows; track row.id) {
                    <li class="flex items-center justify-between gap-3 border-b border-teal-50 pb-3 text-sm">
                      <div>
                        <a [routerLink]="['/offers', row.id]" class="font-semibold text-teal-900 hover:underline">
                          {{ row.title }}
                        </a>
                        <p class="text-[var(--color-muted)]">
                          {{ row.views }} views
                          @if (row.businessName) {
                            · {{ row.businessName }}
                          }
                          · ends {{ row.endsAt | date: 'mediumDate' }}
                        </p>
                      </div>
                      <span class="chip">{{ row.status }}</span>
                    </li>
                  }
                </ul>
              }
            </div>
            <div class="surface-panel bg-gradient-to-br from-teal-700 to-teal-900 text-white">
              <h2 class="font-display text-xl font-semibold">Moderation queue</h2>
              <p class="mt-2 text-sm text-teal-100">Jump into the tabs to approve pending items.</p>
              <ul class="mt-6 space-y-3 text-sm">
                <li class="rounded-xl bg-white/10 px-4 py-3">
                  {{ stats.pendingBusinesses || 0 }} business applications pending
                </li>
                <li class="rounded-xl bg-white/10 px-4 py-3">
                  {{ stats.pendingOffers || 0 }} offers awaiting approval
                </li>
                <li class="rounded-xl bg-white/10 px-4 py-3">
                  {{ stats.expiredOffers || 0 }} expired offers
                </li>
              </ul>
              <div class="mt-6 flex flex-wrap gap-2">
                <button type="button" class="btn-gold !py-2 text-xs" (click)="setTab('businesses')">
                  Review businesses
                </button>
                <button type="button" class="btn-secondary !border-white/30 !bg-white/10 !py-2 !text-white text-xs" (click)="setTab('offers')">
                  Review offers
                </button>
              </div>
            </div>
          </div>
        }

        @if (activeTab === 'businesses') {
          <div class="mt-8 surface-panel">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="font-display text-xl font-semibold text-teal-900">Businesses</h2>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="chip" (click)="loadBusinesses()">All</button>
                <button type="button" class="chip" (click)="loadBusinesses('PENDING')">Pending</button>
                <button type="button" class="chip" (click)="loadBusinesses('APPROVED')">Approved</button>
                <button type="button" class="chip" (click)="loadBusinesses('REJECTED')">Rejected</button>
              </div>
            </div>
            @if (!businesses.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">No businesses found.</p>
            } @else {
              <ul class="mt-4 space-y-3">
                @for (biz of businesses; track biz.id) {
                  <li class="rounded-xl border border-teal-50 px-4 py-3 text-sm">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="font-semibold text-teal-900">{{ biz.name }}</p>
                        <p class="text-[var(--color-muted)]">
                          {{ biz.owner?.name || 'Owner' }} · {{ biz.owner?.email || biz.email }}
                        </p>
                        <p class="text-xs text-teal-700">{{ biz.address || 'No address' }}</p>
                      </div>
                      <span class="chip">{{ biz.status }}</span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" (click)="setBusinessStatus(biz.id, 'APPROVED')">
                        Approve
                      </button>
                      <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="setBusinessStatus(biz.id, 'REJECTED')">
                        Reject
                      </button>
                      <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs !text-amber-800" (click)="setBusinessStatus(biz.id, 'SUSPENDED')">
                        Suspend
                      </button>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        }

        @if (activeTab === 'offers') {
          <div class="mt-8 surface-panel">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="font-display text-xl font-semibold text-teal-900">Offers moderation</h2>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="chip" (click)="loadOffers()">All</button>
                <button type="button" class="chip" (click)="loadOffers('PENDING')">Pending</button>
                <button type="button" class="chip" (click)="loadOffers('ACTIVE')">Active</button>
                <button type="button" class="chip" (click)="loadOffers('DRAFT')">Draft</button>
              </div>
            </div>
            @if (!managedOffers.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">No offers found.</p>
            } @else {
              <ul class="mt-4 space-y-3">
                @for (row of managedOffers; track row.id) {
                  <li class="rounded-xl border border-teal-50 px-4 py-3 text-sm">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <a [routerLink]="['/offers', row.id]" class="font-semibold text-teal-900 hover:underline">
                          {{ row.title }}
                        </a>
                        <p class="text-[var(--color-muted)]">
                          @if (row.businessName) {
                            {{ row.businessName }} ·
                          }
                          {{ row.views }} views · ends {{ row.endsAt | date: 'mediumDate' }}
                        </p>
                      </div>
                      <span class="chip">{{ row.status }}</span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" (click)="setOfferStatus(row.id, 'ACTIVE')">
                        Approve / Publish
                      </button>
                      <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="setOfferStatus(row.id, 'PENDING')">
                        Mark pending
                      </button>
                      <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="setOfferStatus(row.id, 'REJECTED')">
                        Reject
                      </button>
                      <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs !text-red-700" (click)="deleteOffer(row.id)">
                        Delete
                      </button>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        }

        @if (activeTab === 'categories') {
          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <form class="surface-panel space-y-4" [formGroup]="categoryForm" (ngSubmit)="createCategory()">
              <h2 class="font-display text-xl font-semibold text-teal-900">Add category</h2>
              <div>
                <label class="mb-1 block text-sm font-medium" for="catName">Name</label>
                <input id="catName" class="input-field" formControlName="name" placeholder="Food & Dining" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="catSlug">Slug (optional)</label>
                <input id="catSlug" class="input-field" formControlName="slug" placeholder="food-dining" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium" for="catDesc">Description</label>
                <textarea id="catDesc" rows="3" class="input-field" formControlName="description"></textarea>
              </div>
              <button type="submit" class="btn-primary" [disabled]="categoryForm.invalid || savingCategory">
                {{ savingCategory ? 'Saving…' : 'Create category' }}
              </button>
            </form>

            <div class="surface-panel">
              <h2 class="font-display text-xl font-semibold text-teal-900">Categories</h2>
              @if (!categories.length) {
                <p class="mt-4 text-sm text-[var(--color-muted)]">No categories yet.</p>
              } @else {
                <ul class="mt-4 space-y-3">
                  @for (cat of categories; track cat.id) {
                    <li class="flex items-center justify-between gap-3 rounded-xl border border-teal-50 px-4 py-3 text-sm">
                      <div>
                        <p class="font-semibold text-teal-900">{{ cat.name }}</p>
                        <p class="text-[var(--color-muted)]">{{ cat.slug }}</p>
                      </div>
                      <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs !text-red-700" (click)="removeCategory(cat.id)">
                        Delete
                      </button>
                    </li>
                  }
                </ul>
              }
            </div>
          </div>
        }

        @if (activeTab === 'users') {
          <div class="mt-8 surface-panel overflow-x-auto">
            <h2 class="font-display text-xl font-semibold text-teal-900">Users</h2>
            @if (!users.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">No users found.</p>
            } @else {
              <table class="mt-4 w-full min-w-[640px] text-left text-sm">
                <thead class="border-b border-teal-100 text-[var(--color-muted)]">
                  <tr>
                    <th class="pb-3 font-medium">Name</th>
                    <th class="pb-3 font-medium">Email</th>
                    <th class="pb-3 font-medium">Role</th>
                    <th class="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users; track user.id) {
                    <tr class="border-b border-teal-50">
                      <td class="py-3 font-medium text-teal-900">{{ user.name }}</td>
                      <td class="py-3">{{ user.email }}</td>
                      <td class="py-3">
                        <span class="chip">{{ roleName(user) }}</span>
                      </td>
                      <td class="py-3">{{ user.isActive === false ? 'Inactive' : 'Active' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  activeTab: Tab = 'overview';
  tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'businesses', label: 'Businesses' },
    { id: 'offers', label: 'Offers' },
    { id: 'categories', label: 'Categories' },
    { id: 'users', label: 'Users' },
  ];

  stats?: DashboardStats;
  rows: DashboardOfferRow[] = [];
  businesses: AdminBusiness[] = [];
  managedOffers: DashboardOfferRow[] = [];
  categories: AdminCategory[] = [];
  users: AdminUser[] = [];

  loading = true;
  error = '';
  actionMessage = '';
  actionError = '';
  cards: { label: string; value: string }[] = [];
  savingCategory = false;

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
    description: [''],
  });

  ngOnInit(): void {
    this.reloadAll();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.actionMessage = '';
    this.actionError = '';
    if (tab === 'businesses') this.loadBusinesses();
    if (tab === 'offers') this.loadOffers();
    if (tab === 'categories') this.loadCategories();
    if (tab === 'users') this.loadUsers();
  }

  reloadAll(): void {
    this.loading = true;
    this.error = '';
    this.actionMessage = '';
    this.actionError = '';

    this.dashboard.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cards = [
          { label: 'Users', value: String(stats.users ?? 0) },
          { label: 'Businesses', value: String(stats.businesses ?? 0) },
          { label: 'Stores', value: String(stats.stores ?? 0) },
          { label: 'Active offers', value: String(stats.activeOffers) },
          { label: 'Total offers', value: String(stats.totalOffers) },
          { label: 'Views', value: String(stats.totalViews) },
          { label: 'Favourites', value: String(stats.favorites) },
          { label: 'Pending businesses', value: String(stats.pendingBusinesses ?? 0) },
          { label: 'Pending offers', value: String(stats.pendingOffers ?? 0) },
        ];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load admin dashboard. Please log in as ADMIN.';
        this.loading = false;
      },
    });

    this.dashboard.getAdminRecentOffers().subscribe((rows) => (this.rows = rows));
  }

  loadBusinesses(status?: string): void {
    this.admin.getBusinesses(status).subscribe({
      next: (list) => (this.businesses = list),
      error: (err: Error) => (this.actionError = err.message || 'Could not load businesses'),
    });
  }

  loadOffers(status?: string): void {
    this.admin.getManagedOffers(status).subscribe({
      next: (list) => (this.managedOffers = list),
      error: (err: Error) => (this.actionError = err.message || 'Could not load offers'),
    });
  }

  loadCategories(): void {
    this.admin.getCategories().subscribe({
      next: (list) => (this.categories = list),
      error: (err: Error) => (this.actionError = err.message || 'Could not load categories'),
    });
  }

  loadUsers(): void {
    this.admin.getUsers().subscribe({
      next: (list) => (this.users = list),
      error: (err: Error) => (this.actionError = err.message || 'Could not load users'),
    });
  }

  setBusinessStatus(id: string, status: string): void {
    this.actionError = '';
    this.admin.updateBusinessStatus(id, status).subscribe({
      next: (biz) => {
        this.actionMessage = `${biz.name} → ${biz.status}`;
        this.loadBusinesses();
        this.reloadAll();
      },
      error: (err: Error) => (this.actionError = err.message || 'Could not update business'),
    });
  }

  setOfferStatus(id: string, status: string): void {
    this.actionError = '';
    this.admin.updateOfferStatus(id, status).subscribe({
      next: () => {
        this.actionMessage = `Offer marked ${status}`;
        this.loadOffers();
        this.reloadAll();
      },
      error: (err: Error) => (this.actionError = err.message || 'Could not update offer'),
    });
  }

  deleteOffer(id: string): void {
    this.admin.deleteOffer(id).subscribe({
      next: () => {
        this.actionMessage = 'Offer deleted';
        this.loadOffers();
        this.reloadAll();
      },
      error: (err: Error) => (this.actionError = err.message || 'Could not delete offer'),
    });
  }

  createCategory(): void {
    if (this.categoryForm.invalid) return;
    this.savingCategory = true;
    this.actionError = '';
    const value = this.categoryForm.getRawValue();
    this.admin
      .createCategory({
        name: value.name,
        slug: value.slug || undefined,
        description: value.description || undefined,
      })
      .subscribe({
        next: (cat) => {
          this.savingCategory = false;
          this.actionMessage = `Category “${cat.name}” created`;
          this.categoryForm.reset({ name: '', slug: '', description: '' });
          this.loadCategories();
        },
        error: (err: Error) => {
          this.savingCategory = false;
          this.actionError = err.message || 'Could not create category';
        },
      });
  }

  removeCategory(id: string): void {
    this.admin.deleteCategory(id).subscribe({
      next: () => {
        this.actionMessage = 'Category deleted';
        this.loadCategories();
      },
      error: (err: Error) => (this.actionError = err.message || 'Could not delete category'),
    });
  }

  roleName(user: AdminUser): string {
    if (!user.role) return '—';
    return typeof user.role === 'string' ? user.role : user.role.name;
  }
}
