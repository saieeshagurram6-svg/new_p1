/**
 * Stable, sortable-ish local IDs.
 *
 * Product Bible 13 asks for stable IDs so a future backend can sync records
 * without rewriting the domain model. A timestamp prefix plus random suffix is
 * enough for a single-device, local-first V1.
 */
export function createId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}${random}`;
}
