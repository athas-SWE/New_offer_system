import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Contact</h1>
      <p class="section-sub">Questions, partnerships or support — we'd love to hear from you.</p>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <div class="surface-panel">
          <h2 class="font-display text-xl font-semibold text-teal-900">Reach us</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="text-[var(--color-muted)]">Email</dt>
              <dd class="font-medium text-teal-900">hello&#64;offerlanka.lk</dd>
            </div>
            <div>
              <dt class="text-[var(--color-muted)]">Phone</dt>
              <dd class="font-medium text-teal-900">+94 11 200 3000</dd>
            </div>
            <div>
              <dt class="text-[var(--color-muted)]">Office</dt>
              <dd class="font-medium text-teal-900">Colombo 03, Sri Lanka</dd>
            </div>
          </dl>
        </div>

        <form class="surface-panel space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-medium" for="name">Name</label>
            <input id="name" class="input-field" formControlName="name" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium" for="email">Email</label>
            <input id="email" type="email" class="input-field" formControlName="email" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium" for="message">Message</label>
            <textarea id="message" rows="5" class="input-field" formControlName="message"></textarea>
          </div>
          @if (sent) {
            <p class="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-800">Thanks — we'll get back to you soon.</p>
          }
          <button type="submit" class="btn-primary" [disabled]="form.invalid">Send message</button>
        </form>
      </div>
    </div>
  `,
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);

  sent = false;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.sent = true;
    this.form.reset();
  }
}
