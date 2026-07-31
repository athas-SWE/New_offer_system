import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell flex min-h-[70vh] items-center justify-center animate-fade-in">
      <div class="w-full max-w-md surface-panel">
        <img src="images/logo.png" alt="Offer Lanka" class="mx-auto mb-4 h-16 w-auto object-contain" />
        <p class="font-display text-3xl font-semibold text-teal-900">List your shop</p>
        <p class="mt-2 text-sm text-[var(--color-muted)]">
          Create a shop owner account to publish offers on Offer Lanka. Shoppers can browse without logging in.
        </p>

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

          @if (error) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
          }

          <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating…' : 'Create shop account' }}
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
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const value = this.form.getRawValue();
    this.auth
      .register({
        ...value,
        role: 'BUSINESS_OWNER',
      })
      .subscribe({
        next: () => {
          this.loading = false;
          void this.router.navigate(['/business']);
        },
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message || 'Registration failed';
        },
      });
  }
}
