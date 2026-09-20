import { getDatabase } from '@/db/client';
import type { AuthProvider, UserProfile } from '@/domain/types';
import { createId } from '@/utils/id';

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  provider: string;
  created_at: number;
}

function toProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    provider: row.provider as AuthProvider,
    createdAt: row.created_at,
  };
}

export async function getProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT * FROM user_profile ORDER BY created_at ASC LIMIT 1;',
  );
  return row ? toProfile(row) : null;
}

export async function createProfile(input: {
  displayName?: string | null;
  email?: string | null;
  provider: AuthProvider;
}): Promise<UserProfile> {
  const db = await getDatabase();
  const profile: UserProfile = {
    id: createId('usr'),
    displayName: input.displayName ?? null,
    email: input.email ?? null,
    provider: input.provider,
    createdAt: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO user_profile (id, display_name, email, provider, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [profile.id, profile.displayName, profile.email, profile.provider, profile.createdAt],
  );
  return profile;
}

export async function clearProfile(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM user_profile;');
}
