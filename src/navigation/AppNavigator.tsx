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
import WorkoutDetailScreen from '@/screens/client/WorkoutDetailScreen';
import ActiveWorkoutScreen from '@/screens/client/ActiveWorkoutScreen';
import ClientOnboardingScreen from '@/screens/client/ClientOnboardingScreen';
import AssessmentScreen from '@/screens/common/AssessmentScreen';
import MeasurementsScreen from '@/screens/common/MeasurementsScreen';
import CoachClientDetailScreen from '@/screens/coach/CoachClientDetailScreen';
import CoachExerciseEditorScreen from '@/screens/coach/CoachExerciseEditorScreen';
import CoachWorkoutBuilderScreen from '@/screens/coach/CoachWorkoutBuilderScreen';
import { useAppTheme } from '@/hooks/useTheme';
import { ClientStackParamList, CoachStackParamList } from '@/types';

type RootStackParamList = ClientStackParamList & CoachStackParamList & {
  Login: undefined;
  Signup: undefined;
  ClientApp: undefined;
  CoachApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const theme = useAppTheme();
  const { colors } = theme;
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
    <NavigationContainer
      theme={{
        dark: theme.name === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
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
              options={detailHeaderOptions('Client', colors)}
            />
            <Stack.Screen
              name="CoachClientAssessment"
              component={AssessmentScreen}
              options={detailHeaderOptions('Assessment', colors)}
            />
            <Stack.Screen
              name="CoachClientMeasurements"
              component={MeasurementsScreen}
              options={detailHeaderOptions('Measurements', colors)}
            />
            <Stack.Screen
              name="CoachExerciseEditor"
              component={CoachExerciseEditorScreen}
              options={detailHeaderOptions('Exercise', colors)}
            />
            <Stack.Screen
              name="CoachWorkoutBuilder"
              component={CoachWorkoutBuilderScreen}
              options={detailHeaderOptions('Workout Builder', colors)}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="ClientApp"
              component={ClientTabs}
            />

            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={detailHeaderOptions('Workout', colors)}
            />
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={detailHeaderOptions('Active Workout', colors)}
            />
            <Stack.Screen
              name="ExerciseDetail"
              component={ExerciseDetailScreen}
              options={detailHeaderOptions('Exercise', colors)}
            />
            <Stack.Screen
              name="ClientOnboarding"
              component={ClientOnboardingScreen}
              options={detailHeaderOptions('Fitness Profile', colors)}
            />
            <Stack.Screen
              name="ClientAssessment"
              component={AssessmentScreen}
              options={detailHeaderOptions('Assessment', colors)}
            />
            <Stack.Screen
              name="ClientMeasurements"
              component={MeasurementsScreen}
              options={detailHeaderOptions('Measurements', colors)}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function detailHeaderOptions(
  title: string,
  colors: ReturnType<typeof useAppTheme>['colors']
) {
  return {
    headerShown: true,
    title,
    headerStyle: {
      backgroundColor: colors.surface,
    },
    headerTintColor: colors.textPrimary,
  };
}
