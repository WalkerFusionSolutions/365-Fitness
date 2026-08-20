import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/utils/theme';
import { View, Text } from 'react-native';

const MockScreen = ({ name }: { name: string }) => (
  <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{color: colors.textPrimary}}>{name} Screen (Coach)</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export function CoachTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'people';
          if (route.name === 'Clients') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Programs') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          
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
      <Tab.Screen name="Clients" children={() => <MockScreen name="Clients" />} />
      <Tab.Screen name="Programs" children={() => <MockScreen name="Programs" />} />
      <Tab.Screen name="Messages" children={() => <MockScreen name="Messages" />} />
    </Tab.Navigator>
  );
}
