import { environment } from '../../environments/environment';

/**
 * Firebase Auth config stub for Offer Lanka.
 * Replace placeholders in environment.ts with real project credentials,
 * then initialize via @angular/fire when ready.
 */
export const firebaseConfig = environment.firebase;

export const firebaseAuthStub = {
  enabled: false,
  providers: ['email', 'google'] as const,
  note: 'Backend JWT auth is primary; Firebase is optional for social login later.',
};
