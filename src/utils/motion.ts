/**
 * Reduce Motion — Product Bible 08 (Accessibility).
 *
 * "When enabled, replace looping and large movement with fades, opacity changes
 * and instant state transitions. Never make animation the only way to
 * understand progress."
 *
 * The effective setting is the OS preference OR the in-app toggle, so a user can
 * calm the app down without changing a system setting.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useSystemReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {
        /* Older platforms may not answer; default to full motion. */
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setReduced(value);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
