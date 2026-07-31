import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Settings</h1>
      <p class="section-sub">Preferences for how Offer Lanka works for you.</p>

      <div class="mt-8 max-w-2xl space-y-4">
        <div class="surface-panel flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-teal-900">Email alerts</p>
            <p class="text-sm text-[var(--color-muted)]">Get notified about new deals in your cities.</p>
          </div>
          <label class="inline-flex cursor-pointer items-center">
            <input type="checkbox" class="peer sr-only" [(ngModel)]="emailAlerts" />
            <span class="h-6 w-11 rounded-full bg-teal-100 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-teal-600 relative after:content-[''] peer-checked:after:translate-x-full"></span>
          </label>
        </div>

        <div class="surface-panel flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-teal-900">Nearby suggestions</p>
            <p class="text-sm text-[var(--color-muted)]">Use approximate location for nearby offers.</p>
          </div>
          <label class="inline-flex cursor-pointer items-center">
            <input type="checkbox" class="peer sr-only" [(ngModel)]="nearby" />
            <span class="h-6 w-11 rounded-full bg-teal-100 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-teal-600 relative after:content-[''] peer-checked:after:translate-x-full"></span>
          </label>
        </div>

        <div class="surface-panel">
          <label class="mb-1 block text-sm font-medium text-teal-900" for="city">Preferred city</label>
          <select id="city" class="input-field" [(ngModel)]="city">
            <option>Colombo</option>
            <option>Kandy</option>
            <option>Galle</option>
            <option>Negombo</option>
            <option>Nuwara Eliya</option>
            <option>Jaffna</option>
          </select>
        </div>

        <button type="button" class="btn-primary" (click)="save()">{{ saved ? 'Saved' : 'Save preferences' }}</button>
        <a routerLink="/profile" class="btn-secondary ml-2">Back to profile</a>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  emailAlerts = true;
  nearby = true;
  city = 'Colombo';
  saved = false;

  save(): void {
    localStorage.setItem(
      'offer_lanka_settings',
      JSON.stringify({ emailAlerts: this.emailAlerts, nearby: this.nearby, city: this.city })
    );
    this.saved = true;
  }
}
