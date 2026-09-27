import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen.jsx';
import { OnboardingScreen } from '../screens/OnboardingScreen.jsx';
import { LoginScreen } from '../screens/auth/LoginScreen.jsx';
import { SignupScreen } from '../screens/auth/SignupScreen.jsx';
import { DoctorListScreen } from '../screens/patient/DoctorListScreen.jsx';
import { DoctorProfileScreen } from '../screens/patient/DoctorProfileScreen.jsx';
import { useAuthStore } from '../store/authStore.js';

const ONBOARDING_SEEN_KEY = 'phoenixcare-onboarding-seen';
const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then((v) => setOnboardingSeen(!!v));
  }, []);

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;
  if (onboardingSeen === null) return null;
  if (!onboardingSeen) return <OnboardingScreen onDone={() => setOnboardingSeen(true)} />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="DoctorList" component={DoctorListScreen} />
            <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
