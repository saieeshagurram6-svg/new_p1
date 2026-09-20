/**
 * Tab-bar and inline icons.
 *
 * Hand-drawn paths rather than an icon package: four glyphs do not justify a
 * dependency, and these match the rounded, soft line weight of the rest of the
 * interface.
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName = 'drop' | 'calendar' | 'medal' | 'person' | 'undo' | 'plus';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const stroke = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'drop' && <Path d="M12 3c0 0 6 6.8 6 10.4A6 6 0 0 1 6 13.4C6 9.8 12 3 12 3Z" {...stroke} />}
      {name === 'calendar' && (
        <>
          <Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-12Z" {...stroke} />
          <Path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3" {...stroke} />
        </>
      )}
      {name === 'medal' && (
        <>
          <Circle cx={12} cy={14.5} r={5} {...stroke} />
          <Path d="M8.5 9.8 6 3.5h12l-2.5 6.3" {...stroke} />
        </>
      )}
      {name === 'person' && (
        <>
          <Circle cx={12} cy={8} r={3.6} {...stroke} />
          <Path d="M4.8 20c.6-3.7 3.6-5.8 7.2-5.8s6.6 2.1 7.2 5.8" {...stroke} />
        </>
      )}
      {name === 'undo' && <Path d="M9 7H5V3M5.2 7a7 7 0 1 1-1.2 4" {...stroke} />}
      {name === 'plus' && <Path d="M12 5.5v13M5.5 12h13" {...stroke} />}
    </Svg>
  );
}
