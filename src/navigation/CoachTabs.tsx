import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { colors, spacing, typography } from '@/utils/theme';

const dashboardItems = [
  ['Clients', 'Development placeholder'],
  ['Workout Plans', 'Development placeholder'],
  ['Meal Plans', 'Development placeholder'],
  ['Progress', 'Coming soon'],
  ['Messages', 'Coming soon'],
  ['Reports', 'Coming soon'],
] as const;

function CoachDashboardScreen() {
  return (
    <Screen>
      <Text style={styles.title}>365 FITNESS - Coach</Text>
      <View style={styles.list}>
        {dashboardItems.map(([title, subtitle]) => (
          <Card key={title} style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function PlaceholderScreen({
  title,
  subtitle = 'Development placeholder',
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>
      <Card>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </Card>
    </Screen>
  );
}

const Tab = createBottomTabNavigator();

export function CoachTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'people';
          if (route.name === 'Coach') iconName = focused ? 'grid' : 'grid-outline';
          if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Workouts') iconName = focused ? 'barbell' : 'barbell-outline';
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
      <Tab.Screen
        name="Clients"
        children={() => <PlaceholderScreen title="Clients" />}
      />
      <Tab.Screen
        name="Workouts"
        children={() => <PlaceholderScreen title="Workout Plans" />}
      />
      <Tab.Screen
        name="Nutrition"
        children={() => <PlaceholderScreen title="Meal Plans" />}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
