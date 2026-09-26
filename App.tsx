import React, { useState, useEffect } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';

LogBox.ignoreAllLogs();
import { SplashScreen } from './src/screens/Splash/SplashScreen';
import { WelcomeScreen } from './src/screens/Welcome/WelcomeScreen';
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { RegisterScreen } from './src/screens/Auth/RegisterScreen';
import { PasswordScreen } from './src/screens/Auth/PasswordScreen';
import { RootNavigator } from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';
import { AccountProvider } from './src/context/AccountContext';
import { AuthProvider } from './src/context/AuthContext';
import { TradingDataProvider } from './src/context/TradingDataContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from './src/context/AuthContext';

type AppStep = 'SPLASH' | 'WELCOME' | 'LOGIN' | 'REGISTER_EMAIL' | 'REGISTER_PASSWORD' | 'MAIN_APP';

function AppFlow() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<AppStep>('SPLASH');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Handle auto login & token expiry kick-out
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      setCurrentStep('MAIN_APP');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || currentStep === 'SPLASH') {
    return (
      <SplashScreen
        onFinish={() => {
          setCurrentStep('MAIN_APP');
        }}
      />
    );
  }

  // Security Gate: Disallow access to MAIN_APP without authentication unless exploring demo
  if (!isAuthenticated && currentStep !== 'MAIN_APP') {
    if (currentStep === 'WELCOME') {
      return (
        <WelcomeScreen
          onRegister={() => setCurrentStep('REGISTER_EMAIL')}
          onSignIn={() => setCurrentStep('LOGIN')}
          onExploreDemo={() => setCurrentStep('LOGIN')}
        />
      );
    }

    if (currentStep === 'REGISTER_EMAIL') {
      return (
        <RegisterScreen
          onBack={() => setCurrentStep('LOGIN')}
          onSuccess={() => setCurrentStep('REGISTER_PASSWORD')}
          onGoToSignIn={() => setCurrentStep('LOGIN')}
        />
      );
    }

    if (currentStep === 'REGISTER_PASSWORD') {
      return (
        <PasswordScreen
          email={registeredEmail}
          onBack={() => setCurrentStep('REGISTER_EMAIL')}
          onSuccess={() => setCurrentStep('LOGIN')}
        />
      );
    }

    // Default unauthenticated view is strictly LOGIN
    return (
      <LoginScreen
        onBack={() => setCurrentStep('MAIN_APP')}
        onSuccess={() => setCurrentStep('MAIN_APP')}
        onGoToRegister={() => setCurrentStep('REGISTER_EMAIL')}
      />
    );
  }

  // Authenticated: Render Main App
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AccountProvider>
            <TradingDataProvider>
              <AppFlow />
            </TradingDataProvider>
          </AccountProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
