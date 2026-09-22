import React, { useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { AppHeader, AppInput, Badge, IconRow, ProfileAvatar, SectionHeader } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAuth } from '@/hooks/useAuth';
import { useClientAssignments } from '@/hooks/useAssignments';
import { useUpcomingAppointments } from '@/hooks/useAppointments';
import { useFitnessProfile } from '@/hooks/useFitnessProfile';
import { AppServiceError } from '@/services/errors';
import { removeOwnProfileAvatar, uploadOwnProfileAvatar } from '@/services/avatar.service';
import { updateOwnProfileDetails } from '@/services/profiles.service';
import { ThemePreference, useAppTheme } from '@/hooks/useTheme';
import {
  ClientStackParamList,
  CoachTabsParamList,
  FitnessProfileSummary,
} from '@/types';
import { formatWeight } from '@/utils/fitness';
import { radius, spacing, typography } from '@/utils/theme';

const SUPPORT_EMAIL = '365fitnessgnd@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/365fitnessgnd/';

type ClientProfileNavigation = NativeStackNavigationProp<ClientStackParamList>;

export function ProfileScreen() {
  const { colors, themePreference, setThemePreference } = useAppTheme();
  const navigation = useNavigation();
  const { session, profile, error, isLoading, setProfile, signOut } = useAuth();
  const fitness = useFitnessProfile(profile?.role === 'client' ? profile.id : undefined);
  const hasFocused = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phoneNumberInput, setPhoneNumberInput] = useState(profile?.phone_number ?? '');

  useFocusEffect(
    React.useCallback(() => {
      if (hasFocused.current) void fitness.refresh();
      else hasFocused.current = true;
    }, [fitness.refresh])
  );

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (logoutError) {
      const message = logoutError instanceof AppServiceError ? logoutError.userMessage : 'Unable to log out.';
      Alert.alert('Logout Error', message);
    } finally {
      setIsSigningOut(false);
    }
  }

  function beginEditing() {
    setFullName(profile?.full_name ?? '');
    setPhoneNumberInput(profile?.phone_number ?? '');
    setIsEditing(true);
  }

  async function saveProfileDetails() {
    if (!profile || isUpdating) return;
    setIsUpdating(true);
    try {
      const updatedProfile = await updateOwnProfileDetails({
        fullName,
        phoneNumber: phoneNumberInput,
        userId: profile.id,
      });
      setProfile(updatedProfile);
      setIsEditing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (updateError) {
      Alert.alert('Unable to update profile', getUserMessage(updateError, 'Please try again.'));
    } finally {
      setIsUpdating(false);
    }
  }

  async function chooseProfilePhoto() {
    if (!profile || isAvatarBusy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to choose a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsAvatarBusy(true);
    try {
      const updatedProfile = await uploadOwnProfileAvatar({
        asset: result.assets[0],
        currentAvatarPath: profile.avatar_url,
        userId: profile.id,
      });
      setProfile(updatedProfile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (uploadError) {
      Alert.alert('Unable to update photo', getUserMessage(uploadError, 'Please choose another image and try again.'));
    } finally {
      setIsAvatarBusy(false);
    }
  }

  async function removeProfilePhoto() {
    if (!profile || isAvatarBusy) return;
    setIsAvatarBusy(true);
    try {
      const updatedProfile = await removeOwnProfileAvatar(profile.id, profile.avatar_url);
      setProfile(updatedProfile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (removeError) {
      Alert.alert('Unable to remove photo', getUserMessage(removeError, 'Please try again.'));
    } finally {
      setIsAvatarBusy(false);
    }
  }

  function showAvatarActions() {
    if (profile?.role !== 'client' || isAvatarBusy) return;

    const hasAvatar = Boolean(profile.avatar_url);
    const options = hasAvatar ? ['Change Photo', 'Remove Photo', 'Cancel'] : ['Change Photo', 'Cancel'];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { cancelButtonIndex, destructiveButtonIndex: hasAvatar ? 1 : undefined, options },
        (buttonIndex) => {
          if (buttonIndex === 0) void chooseProfilePhoto();
          if (hasAvatar && buttonIndex === 1) void removeProfilePhoto();
        }
      );
      return;
    }

    Alert.alert('Profile Photo', undefined, [
      { text: 'Change Photo', onPress: () => void chooseProfilePhoto() },
      ...(hasAvatar ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => void removeProfilePhoto() }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (isLoading) return <LoadingView label="Loading profile..." />;

  if (error && !profile) {
    return (
      <Screen>
        <ErrorState title="Unable to load your profile" subtitle="Please log out and sign in again." />
        <Button label="Log Out" variant="secondary" onPress={handleLogout} loading={isSigningOut} style={styles.errorLogout} />
      </Screen>
    );
  }

  const accountType = profile?.role === 'coach' ? 'Coach' : 'Client';
  const displayName = profile?.full_name?.trim() || '365 Fitness User';
  const email = session?.user?.email ?? 'Not available';
  const phoneNumber = profile?.phone_number?.trim() || 'Not added';

  return (
    <Screen>
      <AppHeader
        leading={profile?.role === 'client' && navigation.canGoBack() ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: colors.border },
              pressed && { opacity: 0.62 },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : undefined}
        title="Profile"
        subtitle="Your fitness and account hub"
      />

      <View style={[styles.identity, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityLabel={profile?.role === 'client' ? 'Change profile photo' : 'Profile photo'}
          accessibilityRole={profile?.role === 'client' ? 'button' : 'image'}
          disabled={profile?.role !== 'client' || isAvatarBusy}
          onPress={() => {
            void Haptics.selectionAsync();
            showAvatarActions();
          }}
          style={styles.avatarEditor}
        >
          <ProfileAvatar name={displayName} uri={profile?.avatar_url} size={76} />
          {profile?.role === 'client' ? (
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              {isAvatarBusy ? (
                <ActivityIndicator color={colors.primaryText} size="small" />
              ) : (
                <Ionicons name="camera" size={15} color={colors.primaryText} />
              )}
            </View>
          ) : null}
        </Pressable>
        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
            <Badge label={accountType} />
          </View>
          <Text selectable style={[styles.identityDetail, { color: colors.textSecondary }]}>{email}</Text>
          <Text selectable style={[styles.identityDetail, { color: colors.textSecondary }]}>{phoneNumber}</Text>
          {profile?.role === 'client' ? (
            <Pressable accessibilityRole="button" onPress={beginEditing} style={styles.editButton}>
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isEditing && profile?.role === 'client' ? (
        <View style={[styles.editForm, { borderBottomColor: colors.border }]}>
          <AppInput label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <AppInput label="Phone" value={phoneNumberInput} onChangeText={setPhoneNumberInput} keyboardType="phone-pad" placeholder="Optional" />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Email and account role are managed separately and cannot be edited here.</Text>
          <View style={styles.editActions}>
            <Button label="Cancel" variant="secondary" onPress={() => setIsEditing(false)} style={styles.editAction} />
            <Button label="Save" onPress={saveProfileDetails} loading={isUpdating} style={styles.editAction} />
          </View>
        </View>
      ) : null}

      {profile?.role === 'client' ? (
        <ClientProfileHub
          clientId={profile.id}
          fitness={fitness.data}
          fitnessError={fitness.error}
          fitnessLoading={fitness.isLoading}
          onRetry={fitness.refresh}
        />
      ) : (
        <CoachWorkspaceLink />
      )}

      <SectionHeader title="Account" />
      <IconRow icon="mail-outline" title="Email" subtitle={email} right={null} />
      <IconRow icon="call-outline" title="Phone" subtitle={phoneNumber} right={null} />

      <SectionHeader title="Preferences" />
      <View style={styles.preferenceSection}>
        <View style={styles.settingTop}>
          <View style={styles.flex}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>Use the system setting or choose a theme.</Text>
          </View>
          <Ionicons name={themePreference === 'dark' ? 'moon' : themePreference === 'light' ? 'sunny' : 'phone-portrait-outline'} size={22} color={colors.primary} />
        </View>
        <AppearanceSection value={themePreference} onChange={setThemePreference} />
      </View>

      <SectionHeader title="Support" />
      <IconRow icon="mail-unread-outline" title="Contact 365 Fitness" subtitle={SUPPORT_EMAIL} onPress={() => openUrl(`mailto:${SUPPORT_EMAIL}`)} />
      <IconRow icon="logo-instagram" title="Instagram" subtitle="@365fitnessgnd" onPress={() => openUrl(INSTAGRAM_URL)} />
      <IconRow icon="information-circle-outline" title="About 365 Fitness" subtitle={`App version ${Constants.expoConfig?.version ?? '1.0.0'}`} right={null} />

      <SectionHeader title="Security" />
      <Text style={[styles.securityCopy, { color: colors.textSecondary }]}>Your email and role are managed through your authenticated account.</Text>
      <Button label="Log Out" variant="secondary" onPress={handleLogout} loading={isSigningOut} style={styles.logout} />
    </Screen>
  );
}

function ClientProfileHub({
  clientId,
  fitness,
  fitnessError,
  fitnessLoading,
  onRetry,
}: {
  clientId: string;
  fitness: FitnessProfileSummary | null;
  fitnessError: string | null;
  fitnessLoading: boolean;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();
  const navigation = useNavigation<ClientProfileNavigation>();
  const assignments = useClientAssignments();
  const appointments = useUpcomingAppointments(clientId);
  const activeAssignment = assignments.data.find((assignment) => assignment.status === 'active');
  const coach = activeAssignment?.coach ?? null;
  const latest = fitness?.latestMeasurement;

  return (
    <>
      <SectionHeader title="Fitness Overview" />
      {fitnessLoading ? (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Loading fitness profile...</Text>
      ) : fitnessError ? (
        <View style={styles.inlineState}>
          <Text style={[styles.meta, { color: colors.error }]}>Unable to load your fitness profile.</Text>
          <Button label="Try Again" variant="outline" onPress={onRetry} />
        </View>
      ) : fitness ? (
        <View style={[styles.overviewGrid, { borderColor: colors.border }]}>
          <OverviewMetric label="Primary goal" value={fitness.assessment.primaryGoal} wide />
          <OverviewMetric label="Experience" value={fitness.assessment.experienceLevel} />
          <OverviewMetric label="Training" value={fitness.assessment.trainingFrequency} />
          <OverviewMetric label="Current" value={formatWeight(fitness.currentWeightKg)} />
          <OverviewMetric label="Goal" value={formatWeight(fitness.goalWeightKg)} />
        </View>
      ) : (
        <View style={styles.inlineState}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Build your fitness profile</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Complete the assessment so your coach can personalize your plan.</Text>
          <Button label="Get Started" onPress={() => navigation.navigate('ClientOnboarding')} />
        </View>
      )}

      <SectionHeader title="My Coach" />
      {assignments.isLoading ? (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Loading coach relationship...</Text>
      ) : coach ? (
        <View style={[styles.coachSection, { borderBottomColor: colors.border }]}>
          <View style={styles.coachIdentity}>
            <ProfileAvatar name={coach.full_name} uri={coach.avatar_url} size={52} />
            <View style={styles.flex}>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{coach.full_name || 'Your Coach'}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Primary coach</Text>
            </View>
          </View>
          <IconRow icon="chatbubble-outline" title="Message Coach" subtitle="Open your private conversation" onPress={() => navigation.navigate('ClientMessages')} />
          <IconRow
            icon="calendar-outline"
            title={appointments.nextAppointment ? appointments.nextAppointment.title : 'Schedule'}
            subtitle={appointments.nextAppointment ? formatAppointment(appointments.nextAppointment.starts_at) : 'No upcoming appointment'}
            onPress={() => {
              if (appointments.nextAppointment) {
                navigation.navigate('ClientAppointmentDetail', { appointmentId: appointments.nextAppointment.id });
              } else {
                navigation.navigate('ClientAppointments');
              }
            }}
          />
        </View>
      ) : (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>No active coach assignment is available yet.</Text>
      )}

      <SectionHeader title="Fitness Records" />
      <IconRow
        icon="clipboard-outline"
        title="Fitness Assessment"
        subtitle={fitness ? `Completed · ${fitness.assessment.primaryGoal}` : 'Incomplete'}
        onPress={() => {
          if (fitness) navigation.navigate('ClientAssessment');
          else navigation.navigate('ClientOnboarding');
        }}
      />
      <IconRow
        icon="scale-outline"
        title="Measurement History"
        subtitle={fitness ? `${fitness.measurementCount} records${latest?.date ? ` · Last ${formatDate(latest.date)}` : ''} · Recorded by your coach` : 'Recorded by your coach'}
        onPress={() => navigation.navigate('ClientMeasurements')}
      />

      <SectionHeader title="Progress" />
      <IconRow icon="images-outline" title="Progress Photos" subtitle="Private transformation photos" onPress={() => navigation.navigate('ClientApp', { screen: 'Progress' })} />
      <IconRow icon="trending-up-outline" title="Weight Trend" subtitle="Follow coach-recorded changes over time" onPress={() => navigation.navigate('ClientApp', { screen: 'Progress' })} />
      <IconRow
        icon="flag-outline"
        title="Goals"
        subtitle={fitness?.assessment.primaryGoal ?? 'Complete your assessment'}
        onPress={() => {
          if (fitness) navigation.navigate('ClientApp', { screen: 'Progress' });
          else navigation.navigate('ClientOnboarding');
        }}
      />
    </>
  );
}

function CoachWorkspaceLink() {
  const navigation = useNavigation<BottomTabNavigationProp<CoachTabsParamList>>();

  return (
    <>
      <SectionHeader title="Coach Workspace" />
      <IconRow
        icon="people-outline"
        title="Client Management"
        subtitle="Review authorized clients, programs, and progress"
        onPress={() => navigation.navigate('Clients')}
      />
    </>
  );
}

function OverviewMetric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.overviewMetric, wide && styles.overviewMetricWide]}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function AppearanceSection({ value, onChange }: { value: ThemePreference; onChange: (value: ThemePreference) => void }) {
  const { colors } = useAppTheme();
  const options: ThemePreference[] = ['system', 'light', 'dark'];
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: colors.surfaceSecondary }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(option);
            }}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.segmentText, { color: selected ? colors.primaryText : colors.textSecondary }]}>{labelTheme(option)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', 'Please try again from your device.');
  }
}

function getUserMessage(error: unknown, fallback: string) {
  return error instanceof AppServiceError ? error.userMessage : fallback;
}

function formatAppointment(value: string) {
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function labelTheme(value: ThemePreference) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  identity: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, paddingBottom: spacing.lg },
  identityText: { flex: 1, gap: spacing.xs, minWidth: 0 },
  nameRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  name: { ...typography.h2, flexShrink: 1 },
  identityDetail: { ...typography.caption, flexShrink: 1 },
  avatarEditor: { position: 'relative' },
  cameraBadge: { alignItems: 'center', borderRadius: 14, borderWidth: 2, bottom: -2, height: 28, justifyContent: 'center', position: 'absolute', right: -2, width: 28 },
  editButton: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  editButtonText: { ...typography.caption, fontWeight: '800' },
  editForm: { borderBottomWidth: 1, gap: spacing.md, paddingVertical: spacing.lg },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  editAction: { flex: 1 },
  overviewGrid: { borderBottomWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingBottom: spacing.lg },
  overviewMetric: { flexBasis: '44%', flexGrow: 1, gap: spacing.xs, minWidth: 120 },
  overviewMetricWide: { flexBasis: '100%' },
  metricLabel: { ...typography.caption, fontWeight: '600' },
  metricValue: { ...typography.body, fontWeight: '700' },
  coachSection: { borderBottomWidth: 1, paddingBottom: spacing.sm },
  coachIdentity: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  rowTitle: { ...typography.body, fontWeight: '700' },
  meta: { ...typography.caption },
  inlineState: { gap: spacing.md },
  preferenceSection: { gap: spacing.md },
  settingTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  segmented: { borderRadius: radius.md, flexDirection: 'row', padding: 4 },
  segment: { alignItems: 'center', borderRadius: radius.sm, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  segmentText: { ...typography.caption, fontWeight: '800' },
  securityCopy: { ...typography.caption, marginBottom: spacing.md },
  logout: { marginBottom: spacing.lg },
  errorLogout: { marginTop: spacing.md },
  flex: { flex: 1 },
});
