import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, throwError, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../models';
import { homePathForRole, isStaffRole, resolveUserRole } from '../utils/user-role';

const TOKEN_KEY = 'offer_lanka_token';
const REFRESH_KEY = 'offer_lanka_refresh';
const USER_KEY = 'offer_lanka_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser && isStaffRole(this.currentUser.role);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      map((res) => {
        const normalized = this.normalizeAuthResponse(res);
        if (!isStaffRole(normalized.user.role)) {
          throw new Error('Only admin and shop owner accounts can sign in here');
        }
        return normalized;
      }),
      tap((res) => this.persistSession(res)),
      catchError((err: unknown) => {
        if (err instanceof Error && !(err instanceof HttpErrorResponse)) {
          return throwError(() => err);
        }
        const httpErr = err as HttpErrorResponse;
        if (httpErr.status === 0) {
          const demo = this.buildDemoSession(payload.email, 'CUSTOMER');
          if (!isStaffRole(demo.user.role)) {
            return throwError(
              () => new Error('Only admin and shop owner accounts can sign in here'),
            );
          }
          this.persistSession(demo);
          return of(demo);
        }
        return throwError(
          () => new Error((httpErr.error as { message?: string })?.message || 'Login failed'),
        );
      }),
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(
      map((res) => this.normalizeAuthResponse(res)),
      tap((res) => this.persistSession(res)),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          const demo = this.buildDemoSession(
            payload.email,
            payload.role ?? 'CUSTOMER',
            payload.name,
          );
          this.persistSession(demo);
          return of(demo);
        }
        return throwError(
          () => new Error((err.error as { message?: string })?.message || 'Registration failed'),
        );
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    void this.router.navigate(['/login']);
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = resolveUserRole(this.currentUser?.role);
    return !!role && roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isShopOwner(): boolean {
    return this.hasRole('BUSINESS_OWNER');
  }

  homePath(): string {
    return homePathForRole(this.currentUser?.role);
  }

  updateProfile(patch: Partial<User>): Observable<User> {
    return this.api.patch<User>('/users/me', patch).pipe(
      map((user) => this.normalizeUser(user)),
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0 && this.currentUser) {
          const merged = this.normalizeUser({ ...this.currentUser, ...patch });
          localStorage.setItem(USER_KEY, JSON.stringify(merged));
          this.currentUserSubject.next(merged);
          return of(merged);
        }
        return throwError(
          () => new Error((err.error as { message?: string })?.message || 'Update failed'),
        );
      }),
    );
  }

  private normalizeAuthResponse(res: AuthResponse): AuthResponse {
    return {
      ...res,
      user: this.normalizeUser(res.user),
    };
  }

  private normalizeUser(user: User): User {
    const role = resolveUserRole(user?.role) || 'CUSTOMER';
    return { ...user, role };
  }

  private persistSession(res: AuthResponse): void {
    const normalized = this.normalizeAuthResponse(res);
    localStorage.setItem(TOKEN_KEY, normalized.accessToken);
    if (normalized.refreshToken) {
      localStorage.setItem(REFRESH_KEY, normalized.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(normalized.user));
    this.currentUserSubject.next(normalized.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      const user = this.normalizeUser(JSON.parse(raw) as User);
      if (!isStaffRole(user.role)) {
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  private buildDemoSession(email: string, role: UserRole, name?: string): AuthResponse {
    const lower = email.toLowerCase();
    const resolvedRole: UserRole = lower.includes('admin')
      ? 'ADMIN'
      : lower.includes('business') || lower.includes('shop')
        ? 'BUSINESS_OWNER'
        : lower.includes('shopper') || lower.includes('customer')
          ? 'CUSTOMER'
          : role;
    return {
      accessToken: `demo-jwt-${Date.now()}`,
      refreshToken: `demo-refresh-${Date.now()}`,
      user: {
        id: `u-${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        role: resolvedRole,
        phone: '+94 77 000 0000',
      },
    };
  }
}
