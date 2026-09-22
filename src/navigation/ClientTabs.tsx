import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useTheme';
import { FrostedTabBackground } from './FrostedTabBackground';
import NutritionScreen from '@/screens/client/NutritionScreen';
import ClientWorkoutScreen from '@/screens/client/ClientWorkoutScreen';
import DashboardScreen from '@/screens/client/DashboardScreen';
import ClientProgressScreen from '@/screens/client/ClientProgressScreen';
import { ClientTabsParamList } from '@/types';

const Tab = createBottomTabNavigator<ClientTabsParamList>();

export function ClientTabs() {
  const theme = useAppTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync();
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <FrostedTabBackground />,
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Workouts') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Nutrition') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Progress') iconName = focused ? 'analytics' : 'analytics-outline';
          
          return (
            <View style={styles.iconWrap}>
              <Ionicons name={iconName} size={21} color={color} />
              <View
                style={[
                  styles.activeMark,
                  { backgroundColor: focused ? colors.highlight : 'transparent' },
                ]}
              />
            </View>
          );
        },
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: 62,
          marginHorizontal: 10,
          marginBottom: Math.max(insets.bottom, 8),
          paddingTop: 7,
          paddingBottom: 5,
          borderRadius: 22,
          backgroundColor: theme.name === 'dark' ? '#141B19E8' : '#FFFFFFE8',
          borderWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          borderColor: colors.border,
          overflow: 'hidden',
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowColor: '#000000',
          shadowOpacity: theme.name === 'dark' ? 0.28 : 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          lineHeight: 14,
        },
        tabBarLabel: route.name === 'Workouts' ? 'Workout' : route.name,
        tabBarIconStyle: { marginTop: 0 },
        tabBarItemStyle: { minWidth: 0 },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Workouts" component={ClientWorkoutScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Progress" component={ClientProgressScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    height: 27,
    justifyContent: 'space-between',
  },
  activeMark: {
    borderRadius: 2,
    height: 2,
    width: 13,
  },
});
