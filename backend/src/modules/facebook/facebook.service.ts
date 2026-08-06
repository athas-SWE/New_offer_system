import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';

export interface FacebookPageOption {
  id: string;
  name: string;
  accessToken: string;
}

export interface PendingFacebookConnect {
  userId: string;
  shopId: string;
  pages: FacebookPageOption[];
  expiresAt: number;
}

export interface FacebookPostResult {
  postId: string;
  postUrl: string;
  pageName?: string | null;
}

export interface FacebookPublishTarget {
  pageId: string;
  accessToken: string;
  pageName: string | null;
  source: 'env' | 'shop';
}

@Injectable()
export class FacebookService implements OnModuleInit {
  private readonly logger = new Logger(FacebookService.name);
  private oauthReady = false;
  private appId = '';
  private appSecret = '';
  private redirectUri = '';
  private graphVersion = 'v25.0';
  private encryptionKey: Buffer | null = null;
  private publicSiteUrl = 'http://localhost:4200';

  private pageAccessToken = '';
  private publishEnabled = false;
  private maxRetries = 1;
  private retryBaseMs = 1000;
  private postsCacheTtlSec = 60;
  private imageSignedUrlTtlSec = 3600;

  private envPageCache: {
    pageId: string;
    pageName: string;
    expiresAt: number;
  } | null = null;

  private readonly pending = new Map<string, PendingFacebookConnect>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.appId = this.config.get<string>('FACEBOOK_APP_ID', '').trim();
    this.appSecret = this.config.get<string>('FACEBOOK_APP_SECRET', '').trim();
    this.redirectUri = this.config
      .get<string>(
        'FACEBOOK_REDIRECT_URI',
        'http://localhost:3000/api/shops/facebook/callback',
      )
      .trim();
    this.graphVersion = (
      this.config.get<string>('FACEBOOK_GRAPH_API_VERSION') ||
      this.config.get<string>('FACEBOOK_GRAPH_VERSION') ||
      'v25.0'
    ).trim();

    this.pageAccessToken = this.config
      .get<string>('FACEBOOK_PAGE_ACCESS_TOKEN', '')
      .trim();
    this.publishEnabled = this.parseBool(
      this.config.get<string>('FACEBOOK_PUBLISH_ENABLED'),
      false,
    );
    this.maxRetries = Math.max(
      0,
      Number(this.config.get('FACEBOOK_MAX_RETRIES', 1)) || 0,
    );
    this.retryBaseMs = Math.max(
      100,
      Number(this.config.get('FACEBOOK_RETRY_BASE_MS', 1000)) || 1000,
    );
    this.postsCacheTtlSec = Math.max(
      0,
      Number(this.config.get('FACEBOOK_POSTS_CACHE_TTL_SEC', 60)) || 0,
    );
    this.imageSignedUrlTtlSec = Math.max(
      60,
      Number(this.config.get('FACEBOOK_IMAGE_SIGNED_URL_TTL_SEC', 3600)) || 3600,
    );

    this.publicSiteUrl = (
      this.config.get<string>('PUBLIC_SITE_URL') ||
      this.config.get<string>('CORS_ORIGIN') ||
      'http://localhost:4200'
    )
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    const encKey = this.config.get<string>('FACEBOOK_TOKEN_ENCRYPTION_KEY', '').trim();
    if (encKey) {
      this.encryptionKey = this.deriveKey(encKey);
    }
    if (this.appId && this.appSecret && this.encryptionKey) {
      this.oauthReady = true;
      this.logger.log('Facebook OAuth ready (optional per-shop Login)');
    }

    if (this.publishEnabled && this.encryptionKey) {
      this.logger.log(
        `Facebook per-shop Page publish ready (Graph ${this.graphVersion})`,
      );
    } else {
      this.logger.warn(
        'Facebook not ready — set FACEBOOK_PUBLISH_ENABLED=true and FACEBOOK_TOKEN_ENCRYPTION_KEY',
      );
    }

    setInterval(() => this.purgeExpiredPending(), 5 * 60 * 1000).unref?.();
  }

  /** True when shops can configure a Page token and publish. */
  isReady(): boolean {
    return this.publishEnabled && Boolean(this.encryptionKey);
  }

  isEnvPublishReady(): boolean {
    return this.publishEnabled && Boolean(this.pageAccessToken);
  }

  isOAuthReady(): boolean {
    return this.oauthReady;
  }

  isPublishEnabled(): boolean {
    return this.publishEnabled;
  }

  getPublicSiteUrl(): string {
    return this.publicSiteUrl;
  }

  getImageSignedUrlTtlSec(): number {
    return this.imageSignedUrlTtlSec;
  }

  assertPublishReady(): void {
    if (!this.publishEnabled) {
      throw new ServiceUnavailableException(
        'Facebook publishing is disabled (FACEBOOK_PUBLISH_ENABLED=false)',
      );
    }
    if (!this.encryptionKey) {
      throw new ServiceUnavailableException(
        'Facebook posting is unavailable — set FACEBOOK_TOKEN_ENCRYPTION_KEY',
      );
    }
  }

  assertEncryptionReady(): void {
    if (!this.encryptionKey) {
      throw new ServiceUnavailableException(
        'Facebook token storage unavailable — set FACEBOOK_TOKEN_ENCRYPTION_KEY',
      );
    }
  }

  assertOAuthReady(): void {
    if (!this.oauthReady || !this.encryptionKey) {
      throw new ServiceUnavailableException(
        'Facebook Login connect is unavailable — set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET',
      );
    }
  }

  getAuthUrl(userId: string, shopId: string): string {
    this.assertOAuthReady();
    const state = this.signState({ userId, shopId, exp: Date.now() + 15 * 60 * 1000 });
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state,
      scope: 'pages_show_list,pages_manage_posts,pages_read_engagement',
      response_type: 'code',
    });
    return `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params}`;
  }

  verifyState(state: string): { userId: string; shopId: string } {
    const payload = this.verifySignedState(state);
    if (!payload.userId || !payload.shopId) {
      throw new BadRequestException('Invalid Facebook OAuth state');
    }
    if (payload.exp < Date.now()) {
      throw new BadRequestException('Facebook OAuth state expired — try connecting again');
    }
    return { userId: payload.userId, shopId: payload.shopId };
  }

  async exchangeCodeForPages(code: string): Promise<FacebookPageOption[]> {
    this.assertOAuthReady();
    const shortLived = await this.graphGet<{ access_token: string }>('/oauth/access_token', {
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });
    if (!shortLived.access_token) {
      throw new BadRequestException('Facebook did not return an access token');
    }

    const longLived = await this.graphGet<{ access_token: string }>('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLived.access_token,
    });
    const userToken = longLived.access_token || shortLived.access_token;

    const pagesRes = await this.graphGet<{
      data?: Array<{ id: string; name: string; access_token: string }>;
    }>('/me/accounts', {
      access_token: userToken,
      fields: 'id,name,access_token',
      limit: '100',
    });

    const pages = (pagesRes.data || [])
      .filter((p) => p.id && p.access_token)
      .map((p) => ({
        id: p.id,
        name: p.name || p.id,
        accessToken: p.access_token,
      }));

    if (!pages.length) {
      throw new BadRequestException(
        'No Facebook Pages found. Make sure you manage at least one Page and granted Page permissions.',
      );
    }
    return pages;
  }

  createPendingConnect(
    userId: string,
    shopId: string,
    pages: FacebookPageOption[],
  ): string {
    const token = randomBytes(24).toString('hex');
    this.pending.set(token, {
      userId,
      shopId,
      pages,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    return token;
  }

  getPendingConnect(token: string): PendingFacebookConnect {
    const pending = this.pending.get(token);
    if (!pending || pending.expiresAt < Date.now()) {
      this.pending.delete(token);
      throw new BadRequestException(
        'Facebook page selection expired — connect again',
      );
    }
    return pending;
  }

  consumePendingConnect(token: string): PendingFacebookConnect {
    const pending = this.getPendingConnect(token);
    this.pending.delete(token);
    return pending;
  }

  listPendingPages(token: string): Array<{ id: string; name: string }> {
    return this.getPendingConnect(token).pages.map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  encryptToken(plain: string): string {
    this.assertEncryptionReady();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey!, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decryptToken(payload: string): string {
    this.assertEncryptionReady();
    const [ivHex, tagHex, dataHex] = payload.split(':');
    if (!ivHex || !tagHex || !dataHex) {
      throw new BadRequestException('Stored Facebook token is invalid');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey!,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }

  /** Validate a Page access token and return Page id/name. */
  async resolvePageFromToken(
    accessToken: string,
    expectedPageId?: string | null,
  ): Promise<{ pageId: string; pageName: string }> {
    const token = accessToken.trim();
    if (!token) {
      throw new BadRequestException('Facebook Page access token is required');
    }
    const me = await this.graphGet<{ id?: string; name?: string }>('/me', {
      access_token: token,
      fields: 'id,name',
    });
    if (!me.id) {
      throw new BadRequestException(
        'Token did not resolve to a Facebook Page. Use a Page access token, not a user token.',
      );
    }
    if (expectedPageId && expectedPageId.trim() && expectedPageId.trim() !== me.id) {
      throw new BadRequestException(
        'Page ID does not match the Page for this access token',
      );
    }
    return { pageId: me.id, pageName: me.name || me.id };
  }

  /**
   * Each business posts only to their own connected Page.
   */
  async resolvePublishTarget(shop?: {
    facebookPageId?: string | null;
    facebookPageName?: string | null;
    facebookPageAccessToken?: string | null;
  } | null): Promise<FacebookPublishTarget> {
    this.assertPublishReady();

    if (shop?.facebookPageId && shop.facebookPageAccessToken) {
      return {
        pageId: shop.facebookPageId,
        accessToken: this.decryptToken(shop.facebookPageAccessToken),
        pageName: shop.facebookPageName || null,
        source: 'shop',
      };
    }

    throw new BadRequestException(
      'Configure your Facebook Page in Shop settings before posting',
    );
  }

  async postToPage(params: {
    pageId: string;
    accessToken: string;
    message: string;
    link?: string;
    imageUrl?: string | null;
  }): Promise<FacebookPostResult> {
    if (!this.publishEnabled) {
      throw new ServiceUnavailableException(
        'Facebook publishing is disabled (FACEBOOK_PUBLISH_ENABLED=false)',
      );
    }
    const message = params.message.trim();
    if (!message) {
      throw new BadRequestException('Post message is required');
    }

    const imageUrl = params.imageUrl?.trim() || null;

    return this.withRetries(async () => {
      if (imageUrl) {
        const photo = await this.graphPost<{ id?: string; post_id?: string }>(
          `/${params.pageId}/photos`,
          {
            url: imageUrl,
            caption: message,
            access_token: params.accessToken,
          },
        );
        const postId = photo.post_id || photo.id;
        if (!postId) {
          throw new BadRequestException('Facebook photo upload returned no id');
        }
        return {
          postId,
          postUrl: `https://www.facebook.com/${postId}`,
        };
      }

      const body: Record<string, string> = {
        message,
        access_token: params.accessToken,
      };
      if (params.link) body.link = params.link;

      const feed = await this.graphPost<{ id?: string }>(
        `/${params.pageId}/feed`,
        body,
      );
      if (!feed.id) {
        throw new BadRequestException('Facebook feed post returned no id');
      }
      return {
        postId: feed.id,
        postUrl: `https://www.facebook.com/${feed.id}`,
      };
    });
  }

  async publishListing(params: {
    shop?: {
      name?: string | null;
      facebookPageId?: string | null;
      facebookPageName?: string | null;
      facebookPageAccessToken?: string | null;
    } | null;
    kind: 'offer' | 'service' | 'rental';
    title: string;
    description?: string | null;
    priceLine?: string | null;
    link: string;
    imageUrl?: string | null;
  }): Promise<FacebookPostResult> {
    const target = await this.resolvePublishTarget(params.shop);
    const message = this.buildListingCaption({
      kind: params.kind,
      title: params.title,
      description: params.description,
      shopName: params.shop?.name,
      priceLine: params.priceLine,
      link: params.link,
    });
    const result = await this.postToPage({
      pageId: target.pageId,
      accessToken: target.accessToken,
      message,
      link: params.link,
      imageUrl: params.imageUrl,
    });
    return { ...result, pageName: target.pageName };
  }

  buildListingCaption(params: {
    kind: 'offer' | 'service' | 'rental';
    title: string;
    description?: string | null;
    shopName?: string | null;
    priceLine?: string | null;
    link: string;
  }): string {
    const lines: string[] = [];
    const kindLabel =
      params.kind === 'offer' ? 'Offer' : params.kind === 'service' ? 'Service' : 'Rental';
    lines.push(`${kindLabel}: ${params.title}`);
    if (params.shopName) lines.push(`From ${params.shopName}`);
    if (params.priceLine) lines.push(params.priceLine);
    if (params.description) {
      const desc = params.description.replace(/\s+/g, ' ').trim();
      if (desc) {
        lines.push(desc.length > 220 ? `${desc.slice(0, 217)}...` : desc);
      }
    }
    lines.push('');
    lines.push(`View more: ${params.link}`);
    lines.push('#OfferLanka');
    return lines.join('\n');
  }

  private parseBool(value: string | undefined, fallback: boolean): boolean {
    if (value == null || value === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  private deriveKey(secret: string): Buffer {
    if (/^[0-9a-fA-F]{64}$/.test(secret)) {
      return Buffer.from(secret, 'hex');
    }
    return scryptSync(secret, 'offer-lanka-facebook', 32);
  }

  private signState(payload: {
    userId: string;
    shopId: string;
    exp: number;
  }): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.appSecret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private verifySignedState(state: string): {
    userId: string;
    shopId: string;
    exp: number;
  } {
    const [body, sig] = state.split('.');
    if (!body || !sig) {
      throw new BadRequestException('Invalid Facebook OAuth state');
    }
    const expected = createHmac('sha256', this.appSecret).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid Facebook OAuth state signature');
    }
    try {
      return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid Facebook OAuth state payload');
    }
  }

  private graphUrl(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `https://graph.facebook.com/${this.graphVersion}${p}`;
  }

  private async withRetries<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    const attempts = this.maxRetries + 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt >= this.maxRetries) break;
        const delay = this.retryBaseMs * Math.pow(2, attempt);
        this.logger.warn(
          `Facebook request failed (attempt ${attempt + 1}/${attempts}), retrying in ${delay}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    if (
      lastError instanceof BadRequestException ||
      lastError instanceof ServiceUnavailableException
    ) {
      throw lastError;
    }
    const msg = lastError instanceof Error ? lastError.message : 'Facebook post failed';
    throw new BadRequestException(msg);
  }

  private async graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(this.graphUrl(path));
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url);
    const json = (await res.json()) as T & {
      error?: { message?: string; type?: string; code?: number };
    };
    if (!res.ok || json.error) {
      throw new BadRequestException(
        json.error?.message || `Facebook API error (${res.status})`,
      );
    }
    return json;
  }

  private async graphPost<T>(
    path: string,
    body: Record<string, string>,
  ): Promise<T> {
    const url = this.graphUrl(path);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });
    const json = (await res.json()) as T & {
      error?: { message?: string; type?: string; code?: number };
    };
    if (!res.ok || json.error) {
      throw new BadRequestException(
        json.error?.message || `Facebook API error (${res.status})`,
      );
    }
    return json;
  }

  private purgeExpiredPending(): void {
    const now = Date.now();
    for (const [key, value] of this.pending.entries()) {
      if (value.expiresAt < now) this.pending.delete(key);
    }
  }
}
