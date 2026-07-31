import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'offers',
    loadComponent: () => import('./pages/offers/offers.component').then((m) => m.OffersComponent),
  },
  {
    path: 'offers/:id',
    loadComponent: () =>
      import('./pages/offer-details/offer-details.component').then((m) => m.OfferDetailsComponent),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
  },
  {
    path: 'shops',
    loadComponent: () => import('./pages/stores/stores.component').then((m) => m.StoresComponent),
  },
  {
    path: 'shops/:id',
    loadComponent: () =>
      import('./pages/store-details/store-details.component').then((m) => m.StoreDetailsComponent),
  },
  { path: 'stores', redirectTo: 'shops', pathMatch: 'full' },
  { path: 'stores/:id', redirectTo: 'shops/:id' },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'business',
    canActivate: [authGuard, roleGuard('BUSINESS_OWNER', 'ADMIN')],
    loadComponent: () =>
      import('./pages/business-dashboard/business-dashboard.component').then(
        (m) => m.BusinessDashboardComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard, roleGuard('ADMIN', 'BUSINESS_OWNER')],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard, roleGuard('ADMIN', 'BUSINESS_OWNER')],
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  { path: '**', redirectTo: '' },
];
