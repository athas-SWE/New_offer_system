import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SeoService } from './seo.service';

export interface RouteSeoData {
  description?: string;
  keywords?: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'product';
  /** When true, leave meta to the page component (e.g. offer/shop details). */
  dynamic?: boolean;
}

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    const deepest = this.deepestRoute(snapshot);
    const seo = (deepest?.data?.['seo'] || {}) as RouteSeoData;
    const path = snapshot.url.split('?')[0] || '/';

    if (seo.dynamic) {
      // Keep a temporary title until the page loads entity-specific SEO.
      if (pageTitle) {
        this.title.setTitle(`${pageTitle} | Offer Lanka`);
      }
      return;
    }

    this.seo.update({
      title: pageTitle || "Offer Lanka — Sri Lanka's Offers Marketplace",
      description: seo.description,
      keywords: seo.keywords,
      image: seo.image,
      path,
      type: seo.type,
      noIndex: seo.noIndex,
      jsonLd: path === '/' || path === '' ? this.seo.organizationJsonLd() : undefined,
    });
  }

  private deepestRoute(snapshot: RouterStateSnapshot) {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
}
