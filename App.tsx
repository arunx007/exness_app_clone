import React, { useState, useEffect } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs();
import { SplashScreen } from './src/screens/Splash/SplashScreen';
import { WelcomeScreen } from './src/screens/Welcome/WelcomeScreen';
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { RegisterScreen } from './src/screens/Auth/RegisterScreen';
import { PasswordScreen } from './src/screens/Auth/PasswordScreen';
import { RootNavigator } from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';
import { AccountProvider } from './src/context/AccountContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TradingDataProvider } from './src/context/TradingDataContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

type AppStep = 'SPLASH' | 'WELCOME' | 'LOGIN' | 'REGISTER_EMAIL' | 'REGISTER_PASSWORD' | 'MAIN_APP';

function AppFlow() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading, hasCompletedOnboarding, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState<AppStep>('SPLASH');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Synchronize auth state changes
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      setCurrentStep('MAIN_APP');
    } else {
      // If user logs out or is unauthenticated, ensure they NEVER stay on MAIN_APP
      if (currentStep === 'MAIN_APP') {
        setCurrentStep(hasCompletedOnboarding ? 'LOGIN' : 'WELCOME');
      }
    }
  }, [isAuthenticated, isLoading, hasCompletedOnboarding]);

  // While checking session / showing splash
  if (isLoading || currentStep === 'SPLASH') {
    return (
      <SplashScreen
        onFinish={() => {
          if (isAuthenticated) {
            setCurrentStep('MAIN_APP');
          } else if (!hasCompletedOnboarding) {
            // First time install -> show onboarding sliders
            setCurrentStep('WELCOME');
          } else {
            // Returning user but logged out -> show Login
            setCurrentStep('LOGIN');
          }
        }}
      />
    );
  }

  // Security Gate: Disallow access to MAIN_APP without authentication
  if (!isAuthenticated) {
    if (
      currentStep === 'WELCOME' ||
      (!hasCompletedOnboarding &&
        currentStep !== 'REGISTER_EMAIL' &&
        currentStep !== 'REGISTER_PASSWORD' &&
        currentStep !== 'LOGIN')
    ) {
      return (
        <WelcomeScreen
          onRegister={async () => {
            await completeOnboarding();
            setCurrentStep('REGISTER_EMAIL');
          }}
          onSignIn={async () => {
            await completeOnboarding();
            setCurrentStep('LOGIN');
          }}
          onExploreDemo={async () => {
            await completeOnboarding();
            setCurrentStep('LOGIN');
          }}
        />
      );
    }

    if (currentStep === 'REGISTER_EMAIL') {
      return (
        <RegisterScreen
          onBack={() => setCurrentStep(hasCompletedOnboarding ? 'LOGIN' : 'WELCOME')}
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
        onBack={() => setCurrentStep('WELCOME')}
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
