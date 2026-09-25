import React from 'react';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

export interface ExnessLogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
  textColor?: string;
}

export const ExnessLogo: React.FC<ExnessLogoProps> = ({
  size = 28,
  showText = true,
  color = '#FFD000',
  textColor = '#121316',
}) => {
  return (
    <Svg
      width={showText ? size * 5.2 : size}
      height={size}
      viewBox={showText ? '0 0 160 32' : '0 0 32 32'}
    >
      {/* Exness 4-leaf clover emblem: 4 rounded petal dots arranged in a 2x2 grid */}
      <G fill={color}>
        {/* Top-Left */}
        <Path d="M 6 3 C 9.5 3, 12 5.5, 12 9 C 12 12.5, 9.5 13, 6 13 C 2.5 13, 2 9.5, 2 6 C 2 3.5, 3.5 3, 6 3 Z" />
        {/* Top-Right */}
        <Path d="M 20 3 C 23.5 3, 25 3.5, 25 6 C 25 9.5, 24.5 13, 20 13 C 16.5 13, 14 12.5, 14 9 C 14 5.5, 16.5 3, 20 3 Z" />
        {/* Bottom-Left */}
        <Path d="M 6 15 C 9.5 15, 12 15.5, 12 19 C 12 22.5, 9.5 25, 6 25 C 2.5 25, 2 22.5, 2 19 C 2 15.5, 3.5 15, 6 15 Z" />
        {/* Bottom-Right */}
        <Path d="M 20 15 C 23.5 15, 24.5 15.5, 24.5 19 C 24.5 22.5, 23.5 25, 20 25 C 16.5 25, 14 22.5, 14 19 C 14 15.5, 16.5 15, 20 15 Z" />
      </G>

      {/* Exness clean bold lowercase wordmark */}
      {showText && (
        <SvgText
          x="36"
          y="22"
          fill={textColor}
          fontSize="22"
          fontWeight="600"
          letterSpacing="-0.5"
          fontFamily="System"
        >
          exness
        </SvgText>
      )}
    </Svg>
  );
};
