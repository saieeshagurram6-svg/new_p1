/**
 * Authentication — Product Bible 06.3.
 *
 * The screens talk to this interface, not to a vendor SDK. V1 ships the local
 * provider: it creates the same `UserProfile` record a real provider would, so
 * nothing downstream (goals, history, a future sync) has to change when Google
 * and email are wired in. Swapping providers is a one-line change in
 * `getAuthProvider`.
 */

import { createProfile, getProfile } from '@/repositories/profileRepository';
import type { AuthProvider as ProviderKind, UserProfile } from '@/domain/types';

export interface SignInRequest {
  provider: ProviderKind;
  email?: string;
  displayName?: string;
}

export interface AuthProviderAdapter {
  readonly kind: ProviderKind;
  signIn(request: SignInRequest): Promise<UserProfile>;
  restore(): Promise<UserProfile | null>;
}

/**
 * Local adapter. It does not verify anything — it records an identity so the
 * hydration loop has an owner. Real verification arrives with the Google/email
 * adapters; the surface above stays identical.
 */
const localAdapter: AuthProviderAdapter = {
  kind: 'local',

  async signIn(request) {
    const existing = await getProfile();
    if (existing) return existing;

    return createProfile({
      provider: request.provider,
      email: request.email ?? null,
      displayName: request.displayName ?? deriveName(request.email),
    });
  },

  async restore() {
    return getProfile();
  },
};

function deriveName(email?: string | null): string | null {
  if (!email) return null;
  const handle = email.split('@')[0]?.trim();
  if (!handle) return null;
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export function getAuthProvider(): AuthProviderAdapter {
  return localAdapter;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
