import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';

export interface FacebookPageStatus {
  connected: boolean;
  canPost?: boolean;
  pageId: string | null;
  pageName: string | null;
  connectedAt?: string | null;
  configured: boolean;
  oauthReady?: boolean;
  publishEnabled?: boolean;
  mode?: 'shop' | 'env' | 'none';
}

export interface FacebookPendingPages {
  shopId: string;
  pages: Array<{ id: string; name: string }>;
}

export interface FacebookPostResult {
  postId: string;
  postUrl: string;
  pageName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FacebookPageService {
  private readonly api = inject(ApiService);

  getAuthUrl(): Observable<{ url: string }> {
    return this.withError(this.api.get<{ url: string }>('/shops/me/facebook/auth-url'));
  }

  getStatus(): Observable<FacebookPageStatus> {
    return this.withError(this.api.get<FacebookPageStatus>('/shops/me/facebook/status'));
  }

  getPendingPages(connectToken: string): Observable<FacebookPendingPages> {
    return this.withError(
      this.api.get<FacebookPendingPages>('/shops/me/facebook/pending-pages', { connectToken }),
    );
  }

  selectPage(pageId: string, connectToken: string): Observable<FacebookPageStatus> {
    return this.withError(
      this.api.post<FacebookPageStatus>('/shops/me/facebook/select-page', {
        pageId,
        connectToken,
      }),
    );
  }

  /** Save this shop’s own Facebook Page access token. */
  configure(pageAccessToken: string, pageId?: string): Observable<FacebookPageStatus> {
    return this.withError(
      this.api.post<FacebookPageStatus>('/shops/me/facebook/configure', {
        pageAccessToken,
        pageId: pageId || undefined,
      }),
    );
  }

  disconnect(): Observable<FacebookPageStatus> {
    return this.withError(this.api.delete<FacebookPageStatus>('/shops/me/facebook'));
  }

  postOffer(id: string): Observable<FacebookPostResult> {
    return this.withError(this.api.post<FacebookPostResult>(`/offers/${id}/facebook`, {}));
  }

  postService(id: string): Observable<FacebookPostResult> {
    return this.withError(this.api.post<FacebookPostResult>(`/services/${id}/facebook`, {}));
  }

  postRental(id: string): Observable<FacebookPostResult> {
    return this.withError(this.api.post<FacebookPostResult>(`/rentals/${id}/facebook`, {}));
  }

  private withError<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((err: HttpErrorResponse) => {
        const raw = (err.error as { message?: string | string[] } | null)?.message;
        const message = Array.isArray(raw)
          ? raw.join(', ')
          : raw
            ? String(raw)
            : err.message || 'Facebook request failed';
        return throwError(() => new Error(message));
      }),
    );
  }
}
