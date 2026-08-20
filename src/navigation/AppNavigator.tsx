import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { ClientTabs } from './ClientTabs';
import { CoachTabs } from './CoachTabs';
import { LoadingView } from '@/components/StateViews';
import ExerciseDetailScreen from '@/screens/client/ExerciseDetailScreen';
import { colors } from '@/utils/theme';

const Stack = createNativeStackNavigator<any>();

export function AppNavigator() {
  const { profile, setProfile, isLoading, setLoading } = useAuth();

  useEffect(() => {
    // Handle Supabase authentication links opened by the app.
    const handleDeepLink = async (url: string) => {
      try {
        console.log('365 FITNESS deep link received:', url);

        const parsedUrl = Linking.parse(url);

        const accessToken = parsedUrl.queryParams?.access_token;
        const refreshToken = parsedUrl.queryParams?.refresh_token;

        if (accessToken && refreshToken) {
          console.log('Setting Supabase session from deep link...');

          const { error } = await supabase.auth.setSession({
            access_token: String(accessToken),
            refresh_token: String(refreshToken),
          });

          if (error) {
            console.error(
              'Error setting Supabase session:',
              error
            );
          } else {
            console.log(
              'Supabase session successfully restored.'
            );
          }
        }
      } catch (error) {
        console.error(
          'Error handling authentication deep link:',
          error
        );
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

    // Get the currently authenticated user.
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user?.id);
    });

    // Listen for login, logout, signup and session changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchProfile(session?.user?.id);
      }
    );

    return () => {
      subscription.unsubscribe();
      deepLinkSubscription.remove();
    };
  }, []);

  async function fetchProfile(userId?: string) {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(
        'Error fetching user profile:',
        error
      );

      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  if (isLoading) {
    return (
      <LoadingView label="Loading 365 FITNESS..." />
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
          <Stack.Screen
            name="CoachApp"
            component={CoachTabs}
          />
        ) : (
          <>
            <Stack.Screen
              name="ClientApp"
              component={ClientTabs}
            />

            <Stack.Screen
              name="ExerciseDetail"
              component={ExerciseDetailScreen as any}
              options={{
                headerShown: true,
                title: 'Workout',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.textPrimary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}