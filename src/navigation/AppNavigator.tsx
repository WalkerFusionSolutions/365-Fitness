import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { useAuth } from '@/hooks/useAuth';
import {
  getCurrentSession,
  onAuthSessionChange,
  setSessionFromTokens,
} from '@/services/auth.service';
import { getProfileById } from '@/services/profiles.service';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { ClientTabs } from './ClientTabs';
import { CoachTabs } from './CoachTabs';
import { ErrorState, LoadingView } from '@/components/StateViews';
import ExerciseDetailScreen from '@/screens/client/ExerciseDetailScreen';
import ClientOnboardingScreen from '@/screens/client/ClientOnboardingScreen';
import AssessmentScreen from '@/screens/common/AssessmentScreen';
import MeasurementsScreen from '@/screens/common/MeasurementsScreen';
import CoachClientDetailScreen from '@/screens/coach/CoachClientDetailScreen';
import { colors } from '@/utils/theme';
import { ClientStackParamList } from '@/types';

type RootStackParamList = ClientStackParamList & {
  Login: undefined;
  Signup: undefined;
  ClientApp: undefined;
  CoachApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const {
    profile,
    setSession,
    setProfile,
    error,
    setError,
    isLoading,
    setLoading,
    resetAuth,
  } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadProfileForSession = async (sessionUserId?: string) => {
      if (!isMounted) return;

      if (!sessionUserId) {
        resetAuth();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const profileData = await getProfileById(sessionUserId);

        if (!isMounted) return;

        setProfile(profileData);
      } catch (loadError) {
        console.error('Error fetching user profile:', loadError);

        if (!isMounted) return;

        setProfile(null);
        setError('Unable to load your profile.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Handle Supabase authentication links opened by the app.
    const handleDeepLink = async (url: string) => {
      try {
        console.log('365 FITNESS deep link received:', url);

        const parsedUrl = Linking.parse(url);

        const accessToken = parsedUrl.queryParams?.access_token;
        const refreshToken = parsedUrl.queryParams?.refresh_token;

        if (accessToken && refreshToken) {
          console.log('Setting Supabase session from deep link...');

          await setSessionFromTokens(
            String(accessToken),
            String(refreshToken)
          );

          console.log(
            'Supabase session successfully restored.'
          );
        }
      } catch (error) {
        console.error(
          'Error handling authentication deep link:',
          error
        );
      }
    };

    const restoreSession = async () => {
      try {
        const session = await getCurrentSession();

        if (!isMounted) return;

        setSession(session);
        await loadProfileForSession(session?.user?.id);
      } catch (sessionError) {
        console.error('Error restoring authentication session:', sessionError);

        if (!isMounted) return;

        setError('Unable to restore your session.');
        resetAuth();
      }
    };

    // Check whether the app was opened by an authentication link.
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for authentication links while the app is already open.
    const deepLinkSubscription = Linking.addEventListener(
      'url',
      ({ url }) => {
        handleDeepLink(url);
      }
    );

    restoreSession();

    // Listen for login, logout, signup and session changes.
    const unsubscribeAuth = onAuthSessionChange((session) => {
      setSession(session);
      loadProfileForSession(session?.user?.id);
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      deepLinkSubscription.remove();
    };
  }, [
    resetAuth,
    setError,
    setLoading,
    setProfile,
    setSession,
  ]);

  if (isLoading) {
    return (
      <LoadingView label="Loading 365 FITNESS..." />
    );
  }

  if (error && !profile) {
    return (
      <ErrorState
        title="Unable to load your profile"
        subtitle="Close and reopen the app, or sign in again."
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {!profile ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />

            <Stack.Screen
              name="Signup"
              component={SignupScreen}
            />
          </>
        ) : profile.role === 'coach' ? (
          <>
            <Stack.Screen
              name="CoachApp"
              component={CoachTabs}
            />
            <Stack.Screen
              name="CoachClientDetail"
              component={CoachClientDetailScreen}
              options={detailHeaderOptions('Client')}
            />
            <Stack.Screen
              name="CoachClientAssessment"
              component={AssessmentScreen}
              options={detailHeaderOptions('Assessment')}
            />
            <Stack.Screen
              name="CoachClientMeasurements"
              component={MeasurementsScreen}
              options={detailHeaderOptions('Measurements')}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="ClientApp"
              component={ClientTabs}
            />

            <Stack.Screen
              name="ExerciseDetail"
              component={ExerciseDetailScreen}
              options={detailHeaderOptions('Workout')}
            />
            <Stack.Screen
              name="ClientOnboarding"
              component={ClientOnboardingScreen}
              options={detailHeaderOptions('Fitness Profile')}
            />
            <Stack.Screen
              name="ClientAssessment"
              component={AssessmentScreen}
              options={detailHeaderOptions('Assessment')}
            />
            <Stack.Screen
              name="ClientMeasurements"
              component={MeasurementsScreen}
              options={detailHeaderOptions('Measurements')}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function detailHeaderOptions(title: string) {
  return {
    headerShown: true,
    title,
    headerStyle: {
      backgroundColor: colors.surface,
    },
    headerTintColor: colors.textPrimary,
  };
}
