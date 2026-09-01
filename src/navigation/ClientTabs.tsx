import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/theme';
import NutritionScreen from '@/screens/client/NutritionScreen';
import WorkoutHistoryScreen from '@/screens/client/WorkoutHistoryScreen';
import DashboardScreen from '@/screens/client/DashboardScreen';
import ClientCoachScreen from '@/screens/client/ClientCoachScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { ClientTabsParamList } from '@/types';

const Tab = createBottomTabNavigator<ClientTabsParamList>();

export function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Workouts') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Nutrition') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Coach') iconName = focused ? 'people' : 'people-outline';
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
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Workouts" component={WorkoutHistoryScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Coach" component={ClientCoachScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
