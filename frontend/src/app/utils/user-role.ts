import { UserRole } from '../models';

const STAFF_ROLES: UserRole[] = ['ADMIN', 'BUSINESS_OWNER'];

/** Normalize API role values (`"ADMIN"` or `{ name: "ADMIN" }`). */
export function resolveUserRole(role: unknown): UserRole | null {
  if (typeof role === 'string') {
    const upper = role.toUpperCase() as UserRole;
    if (upper === 'ADMIN' || upper === 'BUSINESS_OWNER' || upper === 'CUSTOMER') {
      return upper;
    }
    return null;
  }
  if (role && typeof role === 'object' && 'name' in role) {
    return resolveUserRole((role as { name?: unknown }).name);
  }
  return null;
}

export function isStaffRole(role: unknown): role is UserRole {
  const resolved = resolveUserRole(role);
  return !!resolved && STAFF_ROLES.includes(resolved);
}

export function homePathForRole(role: unknown): string {
  const resolved = resolveUserRole(role);
  if (resolved === 'ADMIN') return '/admin';
  if (resolved === 'BUSINESS_OWNER') return '/business';
  return '/';
}
