import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

export interface SeoConfig {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  robots?: string;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly siteName = 'Offer Lanka';
  private readonly defaultDescription =
    'Discover the best deals, discounts and offers across Sri Lanka with Offer Lanka.';
  private readonly defaultImage = `${environment.siteUrl}/images/logo.png`;

  update(config: SeoConfig): void {
    const fullTitle = config.title.includes(this.siteName)
      ? config.title
      : `${config.title} | ${this.siteName}`;
    const description = this.truncate(config.description || this.defaultDescription, 160);
    const image = this.toAbsoluteUrl(config.image || this.defaultImage);
    const url = this.toAbsoluteUrl(config.path || '/');
    const robots = config.noIndex
      ? 'noindex, nofollow'
      : config.robots || 'index, follow';
    const ogType = config.type || 'website';

    this.title.setTitle(fullTitle);

    this.setNameTag('description', description);
    this.setNameTag('robots', robots);
    this.setNameTag('keywords', config.keywords || 'offers, deals, discounts, Sri Lanka, Colombo, Offer Lanka');
    this.setNameTag('author', this.siteName);

    this.setPropertyTag('og:title', fullTitle);
    this.setPropertyTag('og:description', description);
    this.setPropertyTag('og:image', image);
    this.setPropertyTag('og:url', url);
    this.setPropertyTag('og:type', ogType);
    this.setPropertyTag('og:site_name', this.siteName);
    this.setPropertyTag('og:locale', 'en_LK');

    this.setNameTag('twitter:card', 'summary_large_image');
    this.setNameTag('twitter:title', fullTitle);
    this.setNameTag('twitter:description', description);
    this.setNameTag('twitter:image', image);

    this.setCanonical(url);
    this.setJsonLd(config.jsonLd);
  }

  resetToDefaults(path = '/'): void {
    this.update({
      title: `${this.siteName} — Sri Lanka's Offers Marketplace`,
      description: this.defaultDescription,
      path,
      jsonLd: this.organizationJsonLd(),
    });
  }

  organizationJsonLd(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: environment.siteUrl,
      logo: this.defaultImage,
      description: this.defaultDescription,
      areaServed: 'LK',
    };
  }

  offerJsonLd(offer: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    offerPrice: number;
    originalPrice: number;
    storeName?: string;
    city?: string;
    endsAt: string;
  }): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: offer.title,
      description: offer.description,
      image: this.toAbsoluteUrl(offer.imageUrl),
      url: this.toAbsoluteUrl(`/offers/${offer.id}`),
      price: offer.offerPrice > 0 ? offer.offerPrice : undefined,
      priceCurrency: 'LKR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: offer.endsAt,
      seller: offer.storeName
        ? { '@type': 'Organization', name: offer.storeName }
        : undefined,
      areaServed: offer.city || 'Sri Lanka',
    };
  }

  storeJsonLd(store: {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    coverUrl?: string;
    city: string;
    address: string;
    phone?: string;
    website?: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
  }): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: store.name,
      description: store.description,
      image: this.toAbsoluteUrl(store.coverUrl || store.logoUrl),
      url: this.toAbsoluteUrl(`/shops/${store.id}`),
      telephone: store.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: store.address,
        addressLocality: store.city,
        addressCountry: 'LK',
      },
      geo:
        store.latitude != null && store.longitude != null
          ? {
              '@type': 'GeoCoordinates',
              latitude: store.latitude,
              longitude: store.longitude,
            }
          : undefined,
      aggregateRating:
        store.rating != null
          ? {
              '@type': 'AggregateRating',
              ratingValue: store.rating,
              bestRating: 5,
            }
          : undefined,
      sameAs: store.website ? [store.website] : undefined,
    };
  }

  private setNameTag(name: string, content: string): void {
    if (this.meta.getTag(`name="${name}"`)) {
      this.meta.updateTag({ name, content });
    } else {
      this.meta.addTag({ name, content });
    }
  }

  private setPropertyTag(property: string, content: string): void {
    if (this.meta.getTag(`property="${property}"`)) {
      this.meta.updateTag({ property, content });
    } else {
      this.meta.addTag({ property, content });
    }
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data?: Record<string, unknown> | Record<string, unknown>[]): void {
    const existing = this.document.getElementById('seo-json-ld');
    if (existing) {
      existing.remove();
    }
    if (!data) return;

    const script = this.document.createElement('script');
    script.id = 'seo-json-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private toAbsoluteUrl(pathOrUrl: string): string {
    if (!pathOrUrl) return environment.siteUrl;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const base = environment.siteUrl.replace(/\/$/, '');
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${base}${path}`;
  }

  private truncate(value: string, max: number): string {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= max) return cleaned;
    return `${cleaned.slice(0, max - 1).trimEnd()}…`;
  }
}
