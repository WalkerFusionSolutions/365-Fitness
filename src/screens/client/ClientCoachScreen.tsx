import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { AssignmentWithProfile } from '@/services/assignments.service';
import { useClientAssignments } from '@/hooks/useAssignments';
import { colors, spacing, typography } from '@/utils/theme';

export default function ClientCoachScreen() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    isMutating,
    refresh,
    approve,
    archive,
  } = useClientAssignments();
  const active = data.filter((item) => item.status === 'active');
  const pending = data.filter((item) => item.status === 'pending');

  if (isLoading) {
    return <LoadingView label="Loading coach assignments..." />;
  }

  if (error && data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load assignments"
          subtitle="Please try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <Text style={styles.title}>My Coach</Text>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      {data.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No coach assignment yet."
          subtitle="Pending and active coach assignments will appear here."
        />
      ) : (
        <View style={styles.list}>
          {active.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isMutating={isMutating}
              onArchive={() => archive(assignment.id)}
            />
          ))}
          {pending.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isMutating={isMutating}
              onApprove={() => approve(assignment.id)}
              onArchive={() => archive(assignment.id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function AssignmentCard({
  assignment,
  isMutating,
  onApprove,
  onArchive,
}: {
  assignment: AssignmentWithProfile;
  isMutating: boolean;
  onApprove?: () => void;
  onArchive: () => void;
}) {
  const coachName =
    assignment.coach?.full_name?.trim() ||
    (assignment.status === 'active'
      ? 'Assigned coach'
      : 'Coach profile visible after approval');

  return (
    <Card style={styles.card}>
      <View>
        <Text style={styles.coachName}>{coachName}</Text>
        <Text style={styles.status}>
          {assignment.status === 'active' ? 'Active Coach' : 'Pending Request'}
        </Text>
      </View>
      {assignment.status === 'pending' ? (
        <View style={styles.actions}>
          <Button
            label="Approve"
            onPress={onApprove}
            disabled={isMutating}
            style={styles.actionButton}
          />
          <Button
            label="Decline"
            variant="secondary"
            onPress={onArchive}
            disabled={isMutating}
            style={styles.actionButton}
          />
        </View>
      ) : (
        <Button
          label="Archive"
          variant="secondary"
          onPress={onArchive}
          disabled={isMutating}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inlineError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  coachName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  status: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
