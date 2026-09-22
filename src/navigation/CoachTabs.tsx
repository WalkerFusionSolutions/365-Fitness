import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CoachDashboardScreen from '@/screens/coach/CoachDashboardScreen';
import CoachClientsScreen from '@/screens/coach/CoachClientsScreen';
import CoachProgramsScreen from '@/screens/coach/CoachProgramsScreen';
import CoachMessagesScreen from '@/screens/coach/CoachMessagesScreen';
import CoachAppointmentsScreen from '@/screens/coach/CoachAppointmentsScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { useAppTheme } from '@/hooks/useTheme';
import { CoachTabsParamList } from '@/types';
import { FrostedTabBackground } from './FrostedTabBackground';

const Tab = createBottomTabNavigator<CoachTabsParamList>();

export function CoachTabs() {
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
          let iconName: keyof typeof Ionicons.glyphMap = 'people';
          if (route.name === 'Coach') iconName = focused ? 'grid' : 'grid-outline';
          if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Programs') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return (
            <View style={styles.iconWrap}>
              <Ionicons name={iconName} size={21} color={color} />
              <View style={[styles.activeMark, { backgroundColor: focused ? colors.highlight : 'transparent' }]} />
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
          fontSize: 9,
          lineHeight: 12,
        },
        tabBarLabel:
          route.name === 'Coach'
            ? 'Home'
            : route.name,
        tabBarItemStyle: { minWidth: 0 },
      })}
    >
      <Tab.Screen name="Coach" component={CoachDashboardScreen} />
      <Tab.Screen name="Clients" component={CoachClientsScreen} />
      <Tab.Screen
        name="Programs"
        component={CoachProgramsScreen}
      />
      <Tab.Screen
        name="Schedule"
        component={CoachAppointmentsScreen}
      />
      <Tab.Screen
        name="Messages"
        component={CoachMessagesScreen}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
