import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Badge, IconRow, SectionHeader, StatCard } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useCoachVisibleClients } from '@/hooks/useAssignments';
import { useCoachMealPlans } from '@/hooks/useMealPlan';
import { useAppTheme } from '@/hooks/useTheme';
import { MealPlan } from '@/types';
import { spacing, typography } from '@/utils/theme';

export default function CoachNutritionScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const mealPlans = useCoachMealPlans();
  const clients = useCoachVisibleClients();
  const assignedCount = mealPlans.data.filter((plan) => plan.status === 'assigned').length;
  const draftCount = mealPlans.data.filter((plan) => plan.status === 'draft').length;

  const refresh = () => {
    mealPlans.refresh();
    clients.refresh();
  };

  if (mealPlans.isLoading || clients.isLoading) {
    return <LoadingView label="Loading nutrition tools..." />;
  }

  if (mealPlans.error && mealPlans.data.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load meal plans"
          subtitle={mealPlans.error}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={mealPlans.data}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={mealPlans.isRefreshing || clients.isRefreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <AppHeader
              title="Nutrition"
              subtitle="Create meal plans, assign clients, and manage coaching guidance."
            />
            <View style={styles.statsRow}>
              <StatCard icon="restaurant-outline" label="Meal Plans" value={mealPlans.data.length} />
              <StatCard icon="people-outline" label="Visible Clients" value={clients.data.length} tone="success" />
            </View>
            <View style={styles.statsRow}>
              <StatCard icon="checkmark-circle-outline" label="Assigned" value={assignedCount} />
              <StatCard icon="document-text-outline" label="Drafts" value={draftCount} tone="warning" />
            </View>
            <Button
              label="Create Meal Plan"
              onPress={() => navigation.navigate('CoachMealPlanBuilder')}
              style={styles.primaryAction}
            />

            <SectionHeader title="Client Nutrition" />
            {clients.data.slice(0, 4).map((client) => (
              <IconRow
                key={client.profile.id}
                icon="person-outline"
                title={client.profile.full_name || 'Client'}
                subtitle={client.isPrivilegedAccess ? 'Privileged visible client' : 'Assigned client'}
                onPress={() =>
                  navigation.navigate('CoachMealPlanBuilder', {
                    clientId: client.profile.id,
                  })
                }
              />
            ))}

            <SectionHeader title="Meal Plans" />
            {mealPlans.error ? (
              <Text style={[styles.inlineError, { color: colors.error }]}>{mealPlans.error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            title="No meal plans yet."
            subtitle="Create a draft, add meals, then assign it to a client."
          />
        }
        renderItem={({ item }) => (
          <MealPlanRow
            mealPlan={item}
            onPress={() => navigation.navigate('CoachMealPlanBuilder', { mealPlanId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

function MealPlanRow({ mealPlan, onPress }: { mealPlan: MealPlan; onPress: () => void }) {
  const { colors } = useAppTheme();
  const assigned = mealPlan.status === 'assigned';

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.planRow}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name={assigned ? 'checkmark-circle-outline' : 'document-text-outline'} size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{mealPlan.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {mealPlan.status === 'archived' ? 'Read-only history' : assigned ? 'Read-only assigned plan' : 'Editable draft'}
            {mealPlan.target_calories ? ` • ${Math.round(mealPlan.target_calories)} kcal target` : ''}
          </Text>
        </View>
        <Badge
          label={mealPlan.status || 'draft'}
          tone={mealPlan.status === 'assigned' ? 'success' : mealPlan.status === 'archived' ? 'muted' : 'warning'}
        />
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryAction: {
    marginTop: spacing.md,
  },
  inlineError: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    ...typography.h3,
  },
  meta: {
    ...typography.caption,
  },
  flex: {
    flex: 1,
  },
});
