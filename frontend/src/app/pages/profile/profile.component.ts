import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe, NgIf],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Profile</h1>
      <p class="section-sub">Your Offer Lanka account details.</p>

      <ng-container *ngIf="auth.currentUser$ | async as user">
        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          <div class="surface-panel lg:col-span-1">
            <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-700 font-display text-3xl font-semibold text-gold-400">
              {{ initials(user) }}
            </div>
            <h2 class="mt-4 font-display text-2xl font-semibold text-teal-900">{{ user.name }}</h2>
            <p class="text-sm text-[var(--color-muted)]">{{ user.email }}</p>
            <span class="chip mt-3">{{ user.role }}</span>
            <div class="mt-6 flex flex-col gap-2">
              <a routerLink="/settings" class="btn-secondary !justify-start">Settings</a>
              <button type="button" class="btn-secondary !justify-start !text-red-700" (click)="auth.logout()">Log out</button>
            </div>
          </div>

          <form class="surface-panel space-y-4 lg:col-span-2" [formGroup]="form" (ngSubmit)="save()">
            <h3 class="font-display text-xl font-semibold text-teal-900">Edit profile</h3>
            <div>
              <label class="mb-1 block text-sm font-medium" for="name">Name</label>
              <input id="name" class="input-field" formControlName="name" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium" for="phone">Phone</label>
              <input id="phone" class="input-field" formControlName="phone" />
            </div>
            @if (saved) {
              <p class="text-sm font-medium text-teal-700">Profile updated.</p>
            }
            <button type="submit" class="btn-primary" [disabled]="form.invalid || saving">
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
          </form>
        </div>
      </ng-container>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  saving = false;
  saved = false;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
  });

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.form.patchValue({ name: user.name, phone: user.phone || '' });
    }
  }

  initials(user: User): string {
    return user.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.saved = false;
    this.auth.updateProfile(this.form.getRawValue()).subscribe(() => {
      this.saving = false;
      this.saved = true;
    });
  }
}
