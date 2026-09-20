/**
 * Progress count-up — Product Bible 08: "Count-up from previous value to new
 * value."
 *
 * Driven on the JS thread with requestAnimationFrame rather than through
 * Reanimated: this is a short, low-frequency text change, and keeping it in
 * plain React avoids an animated-text bridge for no visual gain.
 */

import React, { useEffect, useRef, useState } from 'react';

import { duration as motion } from '@/theme';

interface UseCountUpOptions {
  value: number;
  durationMs?: number;
  /** Skip the animation entirely (08, Accessibility). */
  immediate?: boolean;
}

export function useCountUp({
  value,
  durationMs = motion.base,
  immediate = false,
}: UseCountUpOptions): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (immediate || durationMs <= 0) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    if (from === value) return;

    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / durationMs, 1);
      // easeOutCubic — quick arrival, gentle settle.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      setDisplay(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs, immediate]);

  return display;
}

export function CountUp({
  value,
  immediate,
  format,
  children,
}: {
  value: number;
  immediate?: boolean;
  format?: (value: number) => string;
  children: (text: string) => React.ReactElement;
}) {
  const display = useCountUp({ value, immediate });
  return children(format ? format(display) : String(display));
}
