import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { AssignmentWithProfile } from '@/services/assignments.service';
import { useCoachAssignments } from '@/hooks/useAssignments';
import { colors, radius, spacing, typography } from '@/utils/theme';

export default function CoachClientsScreen() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    isMutating,
    refresh,
    createAssignment,
    archive,
  } = useCoachAssignments();
  const [clientId, setClientId] = useState('');
  const active = data.filter((item) => item.status === 'active');
  const pending = data.filter((item) => item.status === 'pending');

  const onCreateAssignment = async () => {
    const trimmedClientId = clientId.trim();

    if (!trimmedClientId) {
      Alert.alert('Client ID required', 'Enter a client profile UUID.');
      return;
    }

    await createAssignment(trimmedClientId);
    setClientId('');
  };

  if (isLoading) {
    return <LoadingView label="Loading clients..." />;
  }

  if (error && data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load clients"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={[...active, ...pending]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>My Clients</Text>
            <Card style={styles.createCard}>
              <Text style={styles.cardTitle}>Create Pending Assignment</Text>
              <Text style={styles.cardSubtitle}>
                Client discovery/invitation workflow requires a future secure design.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Client profile UUID"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                value={clientId}
                onChangeText={setClientId}
              />
              <Button
                label="Create Request"
                onPress={onCreateAssignment}
                loading={isMutating}
              />
            </Card>
            {error ? (
              <Text style={styles.inlineError}>{error}</Text>
            ) : null}
            {active.length > 0 ? (
              <Text style={styles.sectionTitle}>Active</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No clients assigned yet."
            subtitle="Create a pending request when you have a client profile UUID."
          />
        }
        renderItem={({ item, index }) => {
          const firstPendingIndex = active.length;
          const showPendingHeader =
            pending.length > 0 && index === firstPendingIndex;

          return (
            <>
              {showPendingHeader ? (
                <Text style={styles.sectionTitle}>Pending</Text>
              ) : null}
              <AssignmentRow
                assignment={item}
                onArchive={() => archive(item.id)}
                isMutating={isMutating}
              />
            </>
          );
        }}
      />
    </Screen>
  );
}

function AssignmentRow({
  assignment,
  onArchive,
  isMutating,
}: {
  assignment: AssignmentWithProfile;
  onArchive: () => void;
  isMutating: boolean;
}) {
  const clientName =
    assignment.client?.full_name?.trim() ||
    (assignment.status === 'active'
      ? 'Assigned client'
      : 'Client profile hidden until active');

  return (
    <Card style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentText}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.cardSubtitle}>
            {assignment.status === 'active' ? 'Active' : 'Pending request'}
          </Text>
        </View>
        <Text style={styles.status}>{assignment.status}</Text>
      </View>
      <Button
        label="Archive"
        variant="secondary"
        onPress={onArchive}
        disabled={isMutating}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  createCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  inlineError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  assignmentCard: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  assignmentText: {
    flex: 1,
  },
  clientName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  status: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
