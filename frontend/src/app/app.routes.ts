import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    title: "Offer Lanka — Sri Lanka's Offers Marketplace",
    data: {
      seo: {
        description:
          'Discover the best deals, discounts and offers across Sri Lanka. Browse local shops, flash sales and verified promotions near you.',
        keywords: 'offers Sri Lanka, deals Colombo, discounts, local shops, Offer Lanka',
      },
    },
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'offers',
    title: 'All Offers',
    data: {
      seo: {
        description:
          'Browse active deals and discounts from verified shops across Sri Lanka. Filter by city, category and savings.',
        keywords: 'Sri Lanka offers, deals list, discounts, flash sales',
      },
    },
    loadComponent: () => import('./pages/offers/offers.component').then((m) => m.OffersComponent),
  },
  {
    path: 'offers/:id',
    title: 'Offer Details',
    data: { seo: { dynamic: true, type: 'product' } },
    loadComponent: () =>
      import('./pages/offer-details/offer-details.component').then((m) => m.OfferDetailsComponent),
  },
  {
    path: 'categories',
    title: 'Categories',
    data: {
      seo: {
        description:
          'Explore Offer Lanka categories — food, fashion, travel, beauty and more deals across the island.',
      },
    },
    loadComponent: () =>
      import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
  },
  {
    path: 'shops',
    title: 'Shops',
    data: {
      seo: {
        description:
          'Find verified local shops and businesses offering deals on Offer Lanka across Sri Lankan cities.',
        keywords: 'shops Sri Lanka, local businesses, verified stores, Offer Lanka',
      },
    },
    loadComponent: () => import('./pages/stores/stores.component').then((m) => m.StoresComponent),
  },
  {
    path: 'shops/:id',
    title: 'Shop Details',
    data: { seo: { dynamic: true } },
    loadComponent: () =>
      import('./pages/store-details/store-details.component').then((m) => m.StoreDetailsComponent),
  },
  { path: 'stores', redirectTo: 'shops', pathMatch: 'full' },
  { path: 'stores/:id', redirectTo: 'shops/:id' },
  {
    path: 'search',
    title: 'Search Offers',
    data: {
      seo: {
        description: 'Search Offer Lanka for deals, shops and discounts near you in Sri Lanka.',
      },
    },
    loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'login',
    title: 'Login',
    data: { seo: { noIndex: true, description: 'Sign in to your Offer Lanka account.' } },
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Register',
    data: {
      seo: {
        noIndex: true,
        description: 'Create an Offer Lanka account for shoppers or business owners.',
      },
    },
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'business',
    title: 'Business Dashboard',
    data: { seo: { noIndex: true } },
    canActivate: [authGuard, roleGuard('BUSINESS_OWNER', 'ADMIN')],
    loadComponent: () =>
      import('./pages/business-dashboard/business-dashboard.component').then(
        (m) => m.BusinessDashboardComponent
      ),
  },
  {
    path: 'admin',
    title: 'Admin Dashboard',
    data: { seo: { noIndex: true } },
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'profile',
    title: 'Profile',
    data: { seo: { noIndex: true } },
    canActivate: [authGuard, roleGuard('ADMIN', 'BUSINESS_OWNER')],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'settings',
    title: 'Settings',
    data: { seo: { noIndex: true } },
    canActivate: [authGuard, roleGuard('ADMIN', 'BUSINESS_OWNER')],
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'about',
    title: 'About',
    data: {
      seo: {
        description:
          'Learn about Offer Lanka — connecting Sri Lankan shoppers with verified local deals and helping businesses grow.',
      },
    },
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    title: 'Contact',
    data: {
      seo: {
        description:
          'Contact Offer Lanka for support, partnerships or business inquiries. Based in Colombo, Sri Lanka.',
      },
    },
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  { path: '**', redirectTo: '' },
];
