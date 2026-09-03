import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CoachDashboardScreen from '@/screens/coach/CoachDashboardScreen';
import CoachClientsScreen from '@/screens/coach/CoachClientsScreen';
import CoachProgramsScreen from '@/screens/coach/CoachProgramsScreen';
import CoachNutritionScreen from '@/screens/coach/CoachNutritionScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { useAppTheme } from '@/hooks/useTheme';
import { CoachTabsParamList } from '@/types';

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
        component={CoachNutritionScreen}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
