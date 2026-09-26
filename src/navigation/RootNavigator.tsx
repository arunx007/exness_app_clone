import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AccountsScreen } from '../screens/Accounts/AccountsScreen';
import { TradeScreen } from '../screens/Trade/TradeScreen';
import { InsightsScreen } from '../screens/Insights/InsightsScreen';
import { PerformanceScreen } from '../screens/Performance/PerformanceScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import {
  AccountsTabIcon,
  TradeTabIcon,
  InsightsTabIcon,
  PerformanceTabIcon,
  ProfileTabIcon,
} from '../components/common/TabIcons';

export type RootTabParamList = {
  Accounts: undefined;
  Trade: undefined;
  Insights: undefined;
  Performance: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Trade"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          tabBarLabel: 'Accounts',
          tabBarIcon: ({ color }) => <AccountsTabIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Trade"
        component={TradeScreen}
        options={{
          tabBarLabel: 'Trade',
          tabBarIcon: ({ color }) => <TradeTabIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color }) => <InsightsTabIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Performance"
        component={PerformanceScreen}
        options={{
          tabBarLabel: 'Performance',
          tabBarIcon: ({ color }) => <PerformanceTabIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <ProfileTabIcon color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
};
