import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from './src/screens/Splash/SplashScreen';
import { WelcomeScreen } from './src/screens/Welcome/WelcomeScreen';
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { RegisterScreen } from './src/screens/Auth/RegisterScreen';
import { PasswordScreen } from './src/screens/Auth/PasswordScreen';
import { RootNavigator } from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';
import { AccountProvider } from './src/context/AccountContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

type AppStep = 'SPLASH' | 'WELCOME' | 'LOGIN' | 'REGISTER_EMAIL' | 'REGISTER_PASSWORD' | 'MAIN_APP';

function AppFlow() {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState<AppStep>('MAIN_APP');
  const [registeredEmail, setRegisteredEmail] = useState('');

  if (currentStep === 'SPLASH') {
    return <SplashScreen onFinish={() => setCurrentStep('WELCOME')} />;
  }

  if (currentStep === 'WELCOME') {
    return (
      <WelcomeScreen
        onRegister={() => setCurrentStep('REGISTER_EMAIL')}
        onSignIn={() => setCurrentStep('LOGIN')}
        onExploreDemo={() => setCurrentStep('MAIN_APP')}
      />
    );
  }

  if (currentStep === 'LOGIN') {
    return (
      <LoginScreen
        onBack={() => setCurrentStep('WELCOME')}
        onSuccess={() => setCurrentStep('MAIN_APP')}
        onGoToRegister={() => setCurrentStep('REGISTER_EMAIL')}
      />
    );
  }

  if (currentStep === 'REGISTER_EMAIL') {
    return (
      <RegisterScreen
        onBack={() => setCurrentStep('WELCOME')}
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
        onSuccess={() => setCurrentStep('MAIN_APP')}
      />
    );
  }

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
        <AccountProvider>
          <AppFlow />
        </AccountProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
