import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell flex min-h-[70vh] items-center justify-center animate-fade-in">
      <div class="w-full max-w-md surface-panel">
        <p class="font-display text-3xl font-semibold text-teal-900">Welcome back</p>
        <p class="mt-2 text-sm text-[var(--color-muted)]">
          Admin and business owners sign in here. Shoppers can browse offers without an account.
        </p>

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="email">Email</label>
            <input id="email" type="email" class="input-field" formControlName="email" placeholder="you@email.com" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-teal-900" for="password">Password</label>
            <input id="password" type="password" class="input-field" formControlName="password" placeholder="••••••••" />
          </div>

          @if (error) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
          }

          <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in…' : 'Log in' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-[var(--color-muted)]">
          New here?
          <a routerLink="/register" class="font-semibold text-teal-700 hover:underline">Create an account</a>
        </p>
        <p class="mt-2 text-center text-xs text-[var(--color-muted)]">
          Tip: admin&#64;offerlanka.lk · business&#64;offerlanka.lk
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          void this.router.navigateByUrl(returnUrl);
          return;
        }
        if (res.user.role === 'ADMIN') {
          void this.router.navigate(['/admin']);
        } else if (res.user.role === 'BUSINESS_OWNER') {
          void this.router.navigate(['/business']);
        } else {
          // No customer login — send anyone else to the public marketplace
          void this.router.navigate(['/']);
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.error = err.message || 'Login failed';
      },
    });
  }
}
