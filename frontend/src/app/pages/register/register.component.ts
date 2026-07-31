import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell flex min-h-[70vh] items-center justify-center animate-fade-in">
      <div class="w-full max-w-md surface-panel">
        <p class="font-display text-3xl font-semibold text-teal-900">Join Offer Lanka</p>
        <p class="mt-2 text-sm text-[var(--color-muted)]">Create an account to save favourites and unlock dashboards.</p>

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="name">Full name</label>
            <input id="name" class="input-field" formControlName="name" placeholder="Your name" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="email">Email</label>
            <input id="email" type="email" class="input-field" formControlName="email" placeholder="you@email.com" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="phone">Phone (optional)</label>
            <input id="phone" class="input-field" formControlName="phone" placeholder="+94 77 000 0000" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="password">Password</label>
            <input id="password" type="password" class="input-field" formControlName="password" placeholder="At least 8 characters" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="role">I am a</label>
            <select id="role" class="input-field" formControlName="role">
              <option value="CUSTOMER">Shopper</option>
              <option value="BUSINESS_OWNER">Business owner</option>
            </select>
          </div>

          @if (error) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
          }

          <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating…' : 'Create account' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-[var(--color-muted)]">
          Already registered?
          <a routerLink="/login" class="font-semibold text-teal-700 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['CUSTOMER' as UserRole, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const value = this.form.getRawValue();
    this.auth.register(value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user.role === 'BUSINESS_OWNER') {
          void this.router.navigate(['/business']);
        } else if (res.user.role === 'ADMIN') {
          void this.router.navigate(['/admin']);
        } else {
          void this.router.navigate(['/dashboard']);
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.error = err.message || 'Registration failed';
      },
    });
  }
}
