import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import CoachDashboardScreen from '@/screens/coach/CoachDashboardScreen';
import CoachClientsScreen from '@/screens/coach/CoachClientsScreen';
import CoachProgramsScreen from '@/screens/coach/CoachProgramsScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { useAppTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/utils/theme';
import { CoachTabsParamList } from '@/types';

function PlaceholderScreen({
  title,
  subtitle = 'Development placeholder',
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Card>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </Card>
    </Screen>
  );
}

const Tab = createBottomTabNavigator<CoachTabsParamList>();

export function CoachTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'people';
          if (route.name === 'Coach') iconName = focused ? 'grid' : 'grid-outline';
          if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Programs') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Nutrition') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.primaryDark,
          borderTopColor: colors.border,
        }
      })}
    >
      <Tab.Screen name="Coach" component={CoachDashboardScreen} />
      <Tab.Screen name="Clients" component={CoachClientsScreen} />
      <Tab.Screen
        name="Programs"
        component={CoachProgramsScreen}
      />
      <Tab.Screen
        name="Nutrition"
        children={() => <PlaceholderScreen title="Meal Plans" subtitle="Nutrition management coming soon." />}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.h3,
  },
  cardSubtitle: {
    ...typography.body,
  },
});
