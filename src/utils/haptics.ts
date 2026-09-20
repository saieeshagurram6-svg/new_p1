/**
 * Haptics — Product Bible 08: "Light on logging; stronger only on milestone
 * completion."
 *
 * Every call is fire-and-forget and swallows errors: a device without a taptic
 * engine must never break a water log.
 */

import * as Haptics from 'expo-haptics';

type HapticWeight = 'light' | 'medium' | 'success';

let enabled = true;

/** Mirrors `AppSettings.hapticsEnabled` so call sites stay one-liners. */
export function setHapticsEnabled(next: boolean): void {
  enabled = next;
}

export function haptic(weight: HapticWeight): void {
  if (!enabled) return;
  const run =
    weight === 'success'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(
          weight === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light,
        );
  void run.catch(() => {
    /* Haptics are decoration; never surface a failure. */
  });
}
