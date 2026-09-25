import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

export const AccountsTabIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
  </Svg>
);

export const TradeTabIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Two sliders / candlesticks */}
    <Path d="M7 4V20M7 8H5V14H7M7 8H9V14H7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M17 4V20M17 10H15V16H17M17 10H19V16H17" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const InsightsTabIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M3.6 9H20.4M3.6 15H20.4" stroke={color} strokeWidth="1.8" />
    <Path d="M12 3C14.5 6 15.5 9 15.5 12C15.5 15 14.5 18 12 21C9.5 18 8.5 15 8.5 12C8.5 9 9.5 6 12 3Z" stroke={color} strokeWidth="1.8" />
  </Svg>
);

export const PerformanceTabIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Rect x="6" y="12" width="3" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Rect x="11" y="8" width="3" height="11" rx="1" stroke={color} strokeWidth="1.8" />
    <Rect x="16" y="4" width="3" height="15" rx="1" stroke={color} strokeWidth="1.8" />
  </Svg>
);

export const ProfileTabIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="2" />
    <Path d="M6.5 18.5C7.8 16.5 9.8 15.5 12 15.5C14.2 15.5 16.2 16.5 17.5 18.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
