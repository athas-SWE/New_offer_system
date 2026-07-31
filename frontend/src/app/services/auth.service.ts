import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../models';

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
    return !!this.token && !!this.currentUser;
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      tap((res) => this.persistSession(res)),
      catchError(() => {
        const demo = this.buildDemoSession(payload.email, 'CUSTOMER');
        this.persistSession(demo);
        return of(demo);
      })
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(
      tap((res) => this.persistSession(res)),
      catchError(() => {
        const demo = this.buildDemoSession(
          payload.email,
          payload.role ?? 'CUSTOMER',
          payload.name
        );
        this.persistSession(demo);
        return of(demo);
      })
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
    const user = this.currentUser;
    return !!user && roles.includes(user.role);
  }

  updateProfile(patch: Partial<User>): Observable<User> {
    return this.api.patch<User>('/users/me', patch).pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(() => {
        const merged = { ...(this.currentUser as User), ...patch };
        localStorage.setItem(USER_KEY, JSON.stringify(merged));
        this.currentUserSubject.next(merged);
        return of(merged);
      })
    );
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private buildDemoSession(email: string, role: UserRole, name?: string): AuthResponse {
    const lower = email.toLowerCase();
    const resolvedRole: UserRole = lower.includes('admin')
      ? 'ADMIN'
      : lower.includes('business')
        ? 'BUSINESS_OWNER'
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
