import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useTheme';
import NutritionScreen from '@/screens/client/NutritionScreen';
import ClientWorkoutScreen from '@/screens/client/ClientWorkoutScreen';
import DashboardScreen from '@/screens/client/DashboardScreen';
import ClientProgressScreen from '@/screens/client/ClientProgressScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { ClientTabsParamList } from '@/types';

const Tab = createBottomTabNavigator<ClientTabsParamList>();

export function ClientTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Workouts') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Nutrition') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Progress') iconName = focused ? 'analytics' : 'analytics-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          minHeight: 68,
          paddingTop: 8,
          paddingBottom: 10,
          borderRadius: 24,
          backgroundColor: colors.primaryDark,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000000',
          shadowOpacity: 0.14,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 12,
        },
        tabBarLabel:
          route.name === 'Workouts'
            ? 'Workout'
            : route.name,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Workouts" component={ClientWorkoutScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Progress" component={ClientProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
