import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ProfileAvatar } from '@/components/AppUI';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useTheme';
import { getUnreadNotificationCount } from '@/services/notifications.service';
import { ClientStackParamList, ClientTabsParamList } from '@/types';

type ClientHeaderNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabsParamList>,
  NativeStackNavigationProp<ClientStackParamList>
>;

export function ClientHeaderActions({ unreadCount }: { unreadCount?: number }) {
  const theme = useAppTheme();
  const { colors } = theme;
  const { profile } = useAuth();
  const navigation = useNavigation<ClientHeaderNavigation>();
  const [focusedUnreadCount, setFocusedUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (unreadCount != null || !profile?.id) return undefined;

      let active = true;
      void getUnreadNotificationCount()
        .then((count) => {
          if (active) setFocusedUnreadCount(count);
        })
        .catch(() => {
          if (active) setFocusedUnreadCount(0);
        });

      return () => {
        active = false;
      };
    }, [profile?.id, unreadCount])
  );

  const badgeCount = unreadCount ?? focusedUnreadCount;

  return (
    <View
      accessibilityLabel="Schedule, notifications, and profile"
      style={[styles.material, { borderColor: colors.border }]}
    >
      <BlurView
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
        intensity={54}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        tint={theme.name === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
      />
      <HeaderButton
        accessibilityLabel="Open schedule"
        icon="calendar-outline"
        onPress={() => navigation.navigate('ClientAppointments')}
      />
      <HeaderButton
        accessibilityLabel="Open notifications"
        icon="notifications-outline"
        onPress={() => navigation.navigate('Notifications')}
      >
        {badgeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryText }]}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        ) : null}
      </HeaderButton>
      <Pressable
        accessibilityLabel="Open profile"
        accessibilityRole="button"
        hitSlop={2}
        onPress={() => {
          void Haptics.selectionAsync();
          navigation.navigate('ClientProfile');
        }}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
      >
        <ProfileAvatar name={profile?.full_name} uri={profile?.avatar_url} size={32} />
      </Pressable>
    </View>
  );
}

function HeaderButton({
  accessibilityLabel,
  children,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  children?: React.ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  material: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 1,
    overflow: 'hidden',
    paddingHorizontal: 2,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  avatarButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 42,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 15,
    minWidth: 15,
    paddingHorizontal: 3,
    position: 'absolute',
    right: 3,
    top: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  pressed: {
    opacity: 0.62,
  },
});
