import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Brand / social icons registered for <mat-icon svgIcon="...">.
 * Note: Facebook & Instagram are NOT in the Material Icons font
 * (same as MUI — @mui/icons-material ships them as SVG components).
 */
const BRAND_ICONS: Record<string, string> = {
  facebook: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3.1H13.5V9.1c0-.9.3-1.5 1.6-1.5H16.7V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.5V14h2.5v8h3.5z"/>
    </svg>
  `,
  instagram: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm8.75 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>
    </svg>
  `,
  website: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.9 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.9-3.8-9s1.3-6.2 3.8-9z"/>
    </svg>
  `,
};

function registerBrandIcons(): void {
  const registry = inject(MatIconRegistry);
  const sanitizer = inject(DomSanitizer);

  for (const [name, svg] of Object.entries(BRAND_ICONS)) {
    registry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg.trim()));
  }
}

/** Call from appConfig providers to register custom SVG icons. */
export function provideAppIcons(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => registerBrandIcons(),
    },
  ]);
}

/**
 * Suggested Material Icons font names (ligature) for this app.
 * Browse: https://fonts.google.com/icons or https://mui.com/material-ui/material-icons/
 *
 * Usage: <mat-icon>language</mat-icon>
 */
export const MATERIAL_ICON = {
  website: 'language',
  link: 'link',
  share: 'share',
  phone: 'call',
  map: 'map',
  location: 'location_on',
  shop: 'store',
  storefront: 'storefront',
  pos: 'point_of_sale',
  search: 'search',
  favorite: 'favorite',
  favoriteBorder: 'favorite_border',
  verified: 'verified',
  image: 'image',
  delete: 'delete',
  edit: 'edit',
  close: 'close',
  menu: 'menu',
} as const;
