import React from 'react';
import Svg, { Path, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface BrokerBrosLogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
  textColor?: string;
}

export const BrokerBrosLogo: React.FC<BrokerBrosLogoProps> = ({
  size = 28,
  showText = true,
  color = '#FFD000',
  textColor = '#FFFFFF',
}) => {
  return (
    <Svg
      width={showText ? size * 5.8 : size}
      height={size}
      viewBox={showText ? '0 0 200 36' : '0 0 36 36'}
    >
      <Defs>
        <LinearGradient id="bbGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor="#FFA000" />
        </LinearGradient>
      </Defs>

      {/* Modern stylized dynamic BB shield / hexagon financial mark */}
      <G fill="url(#bbGrad)">
        {/* Left B pillar */}
        <Path
          d="M 4 4 L 16 4 C 19.5 4 22 6.5 22 10 C 22 12.5 20.5 14.5 18 15.5 C 21 16.5 23 19 23 22 C 23 26 19.5 28 15.5 28 L 4 28 Z M 9 9 L 9 13.5 L 15 13.5 C 16.5 13.5 17.5 12.5 17.5 11.2 C 17.5 10 16.5 9 15 9 Z M 9 18.5 L 9 23 L 15.5 23 C 17 23 18 22 18 20.7 C 18 19.5 17 18.5 15.5 18.5 Z"
          fillRule="evenodd"
        />
        {/* Second layered stylized geometric wing */}
        <Path
          d="M 25 9 L 28 6 L 31 9 L 28 12 Z M 27 15 L 32 15 L 29 20 Z"
          opacity="0.9"
        />
      </G>

      {/* Clean Modern Wordmark: BROKER BROS */}
      {showText && (
        <G>
          <SvgText
            x="40"
            y="23"
            fill={textColor}
            fontSize="18"
            fontWeight="800"
            letterSpacing="-0.3"
            fontFamily="System"
          >
            BROKER
          </SvgText>
          <SvgText
            x="122"
            y="23"
            fill={color}
            fontSize="18"
            fontWeight="800"
            letterSpacing="-0.3"
            fontFamily="System"
          >
            BROS
          </SvgText>
        </G>
      )}
    </Svg>
  );
};
