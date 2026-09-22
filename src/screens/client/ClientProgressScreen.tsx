import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import {
  AppHeader,
  AppInput,
  FilterChip,
  IconRow,
  ProgressBar,
  SectionHeader,
} from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ClientHeaderActions } from '@/components/ClientHeaderActions';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { UnitToggle } from '@/components/Questionnaire';
import { useAuth } from '@/hooks/useAuth';
import { useClientProgress } from '@/hooks/useProgress';
import { useAppTheme } from '@/hooks/useTheme';
import { calculateProgressPercent } from '@/services/progress.service';
import {
  ClientTabsParamList,
  CoachStackParamList,
  Measurement,
  ProgressPhotoPose,
  ProgressPhotoWithUrl,
  WeightUnit,
} from '@/types';
import { formatWeight, weightToKg } from '@/utils/fitness';
import { radius, spacing, typography } from '@/utils/theme';

type ProgressRoute =
  | RouteProp<ClientTabsParamList, 'Progress'>
  | RouteProp<CoachStackParamList, 'CoachClientProgress'>;
type LengthUnit = 'cm' | 'in';

const poseOptions: ProgressPhotoPose[] = ['front', 'side', 'back'];
const extraMeasurementFields = [
  ['hips', 'Hips'],
  ['leftArm', 'Left Arm'],
  ['rightArm', 'Right Arm'],
  ['leftThigh', 'Left Thigh'],
  ['rightThigh', 'Right Thigh'],
  ['neck', 'Neck'],
] as const;

export default function ClientProgressScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const route = useRoute<ProgressRoute>();
  const { profile } = useAuth();
  const params = route.params as { clientId?: string; clientName?: string } | undefined;
  const clientId = params?.clientId ?? profile?.id;
  const clientName = params?.clientName ?? profile?.full_name ?? 'Client';
  const isCoachView = profile?.role === 'coach' && Boolean(params?.clientId);
  const canAddMeasurement = Boolean(isCoachView && clientId);
  const canManagePhotos = Boolean(clientId && profile?.role === 'client' && clientId === profile.id);
  const progress = useClientProgress(clientId);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>('cm');
  const [date, setDate] = useState(todayDate());
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [neck, setNeck] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPose, setPhotoPose] = useState<ProgressPhotoPose>('front');
  const [photoNotes, setPhotoNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoWithUrl | null>(null);
  const [comparePose, setComparePose] = useState<ProgressPhotoPose>('front');

  useFocusEffect(
    React.useCallback(() => {
      void progress.refresh();
    }, [progress.refresh])
  );

  const photosByDate = useMemo(
    () => groupPhotosByDate(progress.data?.photos ?? []),
    [progress.data?.photos]
  );
  const comparison = useMemo(
    () => getComparison(progress.data?.photos ?? [], comparePose),
    [comparePose, progress.data?.photos]
  );
  const photoColumnCount = width < 360 ? 2 : 3;
  const photoTileWidth = Math.max(
    84,
    (width - 40 - spacing.sm * (photoColumnCount - 1)) / photoColumnCount
  );

  if (progress.isLoading) return <LoadingView label="Loading progress..." />;

  if (progress.error && !progress.data) {
    return (
      <Screen>
        <ErrorState title="Unable to load progress" subtitle={progress.error} onRetry={progress.refresh} />
      </Screen>
    );
  }

  const data = progress.data;
  const latestMeasurement = data?.measurements[data.measurements.length - 1] ?? null;
  const progressPercent = calculateProgressPercent(
    data?.startingWeightKg,
    data?.currentWeightKg,
    data?.goalWeightKg
  );
  const chartWidth = Math.max(240, width - spacing.md * 2);

  async function saveMeasurement() {
    if (!canAddMeasurement) return;

    const values = {
      date: normalizeDate(date) ?? undefined,
      weight: parsePositive(weight) ? weightToKg(Number(weight), weightUnit) : null,
      bodyFat: parsePositive(bodyFat),
      chest: toCm(chest, lengthUnit),
      waist: toCm(waist, lengthUnit),
      hips: toCm(hips, lengthUnit),
      leftArm: toCm(leftArm, lengthUnit),
      rightArm: toCm(rightArm, lengthUnit),
      leftThigh: toCm(leftThigh, lengthUnit),
      rightThigh: toCm(rightThigh, lengthUnit),
      neck: toCm(neck, lengthUnit),
      notes,
    };

    if (!values.date) {
      Alert.alert('Check the date', 'Use a valid date in YYYY-MM-DD format.');
      return;
    }

    if (!Object.entries(values).some(([key, value]) => key !== 'date' && key !== 'notes' && value)) {
      Alert.alert('Measurement needed', 'Enter at least one measurement.');
      return;
    }

    const saved = await progress.addMeasurement(values);
    if (saved) {
      setWeight('');
      setBodyFat('');
      setChest('');
      setWaist('');
      setHips('');
      setLeftArm('');
      setRightArm('');
      setLeftThigh('');
      setRightThigh('');
      setNeck('');
      setNotes('');
      setShowMeasurementForm(false);
    }
  }

  async function addPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to upload progress photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    await progress.addPhoto({
      asset: result.assets[0],
      notes: photoNotes,
      pose: photoPose,
      takenAt: todayDate(),
    });
    setPhotoNotes('');
  }

  function openMeasurementHistory() {
    navigation.navigate(
      isCoachView ? 'CoachClientMeasurements' : 'ClientMeasurements',
      isCoachView ? { clientId, clientName } : undefined
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={progress.refresh} />}>
      <AppHeader
        eyebrow={isCoachView ? 'CLIENT PROGRESS' : undefined}
        title={isCoachView ? clientName : 'Progress'}
        subtitle={isCoachView ? 'Review coaching outcomes and records.' : 'Your coaching journey, measured clearly.'}
        action={isCoachView ? undefined : <ClientHeaderActions />}
      />

      {progress.error ? <Text style={[styles.inlineError, { color: colors.error }]}>{progress.error}</Text> : null}

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CURRENT STATUS</Text>
      <View style={[styles.currentStatus, { borderColor: colors.border }]}>
        <Metric label="Current weight" value={formatWeight(data?.currentWeightKg)} />
        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
        <Metric label="Goal weight" value={formatWeight(data?.goalWeightKg)} />
      </View>

      <SectionHeader title="Goal Progress" />
      <View style={[styles.sectionBlock, { borderBottomColor: colors.border }]}>
        <Text style={[styles.goalTitle, { color: colors.primary }]}>
          {data?.assessment?.primaryGoal ?? 'Assessment not completed'}
        </Text>
        <View style={styles.goalMetrics}>
          <SmallMetric label="Starting" value={formatWeight(data?.startingWeightKg)} />
          <SmallMetric label="Current" value={formatWeight(data?.currentWeightKg)} />
          <SmallMetric label="Target" value={formatWeight(data?.goalWeightKg)} />
        </View>
        {progressPercent != null ? <ProgressBar value={progressPercent} /> : null}
        <Text style={[styles.supportingText, { color: colors.textSecondary }]}>
          {describeWeightProgress(data?.startingWeightKg, data?.currentWeightKg, data?.goalWeightKg)}
        </Text>
      </View>

      <SectionHeader title="Weight Trend" />
      <View style={[styles.chartSection, { borderBottomColor: colors.border }]}>
        {data && data.chartPoints.length >= 2 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: data.chartPoints.map((point) => point.label),
                datasets: [{ data: data.chartPoints.map((point) => point.weightKg) }],
              }}
              width={Math.max(chartWidth, data.chartPoints.length * 62)}
              height={210}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: colors.background,
                backgroundGradientFrom: colors.background,
                backgroundGradientTo: colors.background,
                color: () => colors.primary,
                decimalPlaces: 1,
                labelColor: () => colors.textSecondary,
                propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '4' },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        ) : (
          <EmptyState
            icon="analytics-outline"
            title="Trend begins with two records"
            subtitle="Your coach needs at least two weight records before a real trend can be shown."
          />
        )}
      </View>

      <SectionHeader
        title="Measurements"
        actionLabel={canAddMeasurement ? (showMeasurementForm ? 'Close' : 'Record') : 'View history'}
        onAction={canAddMeasurement ? () => setShowMeasurementForm((value) => !value) : openMeasurementHistory}
      />
      {!isCoachView ? (
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Measurements are recorded by your coach.</Text>
        </View>
      ) : null}

      {showMeasurementForm && canAddMeasurement ? (
        <Card style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Record Measurement</Text>
          <AppInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <UnitToggle options={['lb', 'kg']} value={weightUnit} onChange={setWeightUnit} />
          <MeasurementInput label="Weight" value={weight} onChangeText={setWeight} suffix={weightUnit} />
          <UnitToggle options={['cm', 'in']} value={lengthUnit} onChange={setLengthUnit} />
          <MeasurementInput label="Waist" value={waist} onChangeText={setWaist} suffix={lengthUnit} />
          <MeasurementInput label="Chest" value={chest} onChangeText={setChest} suffix={lengthUnit} />
          <MeasurementInput label="Body Fat" value={bodyFat} onChangeText={setBodyFat} suffix="%" />
          {extraMeasurementFields.map(([key, label]) => (
            <MeasurementInput
              key={key}
              label={label}
              value={getExtraFieldValue(key, { hips, leftArm, rightArm, leftThigh, rightThigh, neck })}
              onChangeText={getExtraFieldSetter(key, { setHips, setLeftArm, setRightArm, setLeftThigh, setRightThigh, setNeck })}
              suffix={lengthUnit}
            />
          ))}
          <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
          <Button label="Save Measurement" onPress={saveMeasurement} loading={progress.isSaving} />
        </Card>
      ) : null}

      {latestMeasurement ? (
        <View style={[styles.latestMeasurement, { borderBottomColor: colors.border }]}>
          <View style={styles.latestHeader}>
            <View style={styles.flex}>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Latest record</Text>
              <Text style={[styles.supportingText, { color: colors.textSecondary }]}>{formatDate(latestMeasurement.date)}</Text>
            </View>
            <Text style={[styles.recordCount, { color: colors.primary }]}>{data?.measurements.length ?? 0} total</Text>
          </View>
          <View style={styles.measurementValues}>
            {measurementHighlights(latestMeasurement).map((item) => (
              <SmallMetric key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
          <IconRow icon="time-outline" title="Measurement History" subtitle="Review every coach-recorded check-in" onPress={openMeasurementHistory} />
        </View>
      ) : (
        <EmptyState
          icon="body-outline"
          title="No measurements yet"
          subtitle={isCoachView ? 'Record the first check-in for this client.' : "Your coach's records will appear here."}
        />
      )}

      <SectionHeader title="Progress Photos" />
      {canManagePhotos ? (
        <Card style={styles.photoForm}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Add a private progress photo</Text>
          <View style={styles.chipRow}>
            {poseOptions.map((pose) => (
              <FilterChip key={pose} label={labelPose(pose)} active={photoPose === pose} onPress={() => setPhotoPose(pose)} />
            ))}
          </View>
          <AppInput label="Notes" value={photoNotes} onChangeText={setPhotoNotes} placeholder="Optional" />
          <Button label="Upload Photo" onPress={addPhoto} loading={progress.isSaving} />
        </Card>
      ) : null}

      {photosByDate.length > 0 ? (
        photosByDate.map((group) => (
          <View key={group.date} style={styles.photoGroup}>
            <Text style={[styles.dateTitle, { color: colors.textPrimary }]}>{formatDate(group.date)}</Text>
            <View style={styles.photoRow}>
              {group.photos.map((photo) => (
                <Pressable
                  accessibilityLabel={`View ${labelPose(photo.pose)} progress photo from ${formatDate(photo.taken_at)}`}
                  accessibilityRole="button"
                  key={photo.id}
                  onPress={() => setSelectedPhoto(photo)}
                  style={[styles.photoTile, { width: photoTileWidth }]}
                >
                  {photo.signedUrl ? (
                    <Image source={{ uri: photo.signedUrl }} style={styles.photoImage} />
                  ) : (
                    <View style={[styles.photoImage, styles.photoFallback, { backgroundColor: colors.surfaceSecondary }]}>
                      <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                    </View>
                  )}
                  <Text style={[styles.photoLabel, { color: colors.textPrimary }]}>{labelPose(photo.pose)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      ) : (
        <EmptyState icon="images-outline" title="No progress photos yet" subtitle="Private photos you add will appear here." />
      )}

      <SectionHeader title="Compare Photos" />
      <View style={styles.comparisonSection}>
        <View style={styles.chipRow}>
          {poseOptions.map((pose) => (
            <FilterChip key={pose} label={labelPose(pose)} active={comparePose === pose} onPress={() => setComparePose(pose)} />
          ))}
        </View>
        {comparison ? (
          <View style={styles.compareRow}>
            <ComparePhoto label="Start" photo={comparison.start} />
            <ComparePhoto label="Current" photo={comparison.current} />
          </View>
        ) : (
          <Text style={[styles.supportingText, { color: colors.textSecondary }]}>
            Add at least two {labelPose(comparePose).toLowerCase()} photos on different dates to compare.
          </Text>
        )}
      </View>

      {!isCoachView && data?.assessment ? (
        <IconRow
          icon="clipboard-outline"
          title="Fitness Assessment"
          subtitle="Review the goal and context behind your progress"
          onPress={() => navigation.navigate('ClientAssessment')}
        />
      ) : null}

      <PhotoDetail
        canDelete={canManagePhotos}
        isLoading={progress.isSaving}
        onClose={() => setSelectedPhoto(null)}
        onDelete={(photo) => {
          Alert.alert('Delete photo?', 'This removes the progress photo from your private storage.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                const deleted = await progress.removePhoto(photo);
                if (deleted) setSelectedPhoto(null);
              },
            },
          ]);
        }}
        photo={selectedPhoto}
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.metric}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.smallMetric}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={[styles.smallMetricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function MeasurementInput({ label, onChangeText, suffix, value }: { label: string; value: string; onChangeText: (value: string) => void; suffix: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.inputRow}>
      <AppInput label={label} keyboardType="decimal-pad" value={value} onChangeText={onChangeText} placeholder="0" style={styles.input} />
      <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text>
    </View>
  );
}

function ComparePhoto({ label, photo }: { label: string; photo: ProgressPhotoWithUrl }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.comparePanel}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.dateTitle, { color: colors.textPrimary }]}>{formatDate(photo.taken_at)}</Text>
      {photo.signedUrl ? (
        <Image source={{ uri: photo.signedUrl }} style={styles.compareImage} />
      ) : (
        <View style={[styles.compareImage, styles.photoFallback, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="image-outline" size={30} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

function PhotoDetail({ canDelete, isLoading, onClose, onDelete, photo }: { canDelete: boolean; isLoading: boolean; onClose: () => void; onDelete: (photo: ProgressPhotoWithUrl) => void; photo: ProgressPhotoWithUrl | null }) {
  const { colors } = useAppTheme();
  return (
    <Modal animationType="slide" transparent visible={Boolean(photo)} onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.modalBackdrop}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          {photo ? (
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {photo.signedUrl ? (
                <Image source={{ uri: photo.signedUrl }} style={styles.detailImage} resizeMode="contain" />
              ) : (
                <View style={[styles.detailImage, styles.photoFallback, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                </View>
              )}
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{labelPose(photo.pose)}</Text>
              <Text style={[styles.supportingText, { color: colors.textSecondary }]}>{formatDate(photo.taken_at)}</Text>
              {photo.notes ? <Text style={[styles.notes, { color: colors.textPrimary }]}>{photo.notes}</Text> : null}
              <View style={styles.modalActions}>
                <Button label="Close" variant="secondary" onPress={onClose} />
                {canDelete ? <Button label="Delete" variant="outline" onPress={() => onDelete(photo)} loading={isLoading} /> : null}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function measurementHighlights(measurement: Measurement) {
  return [
    measurement.weight != null ? { label: 'Weight', value: formatWeight(measurement.weight) } : null,
    measurement.waist != null ? { label: 'Waist', value: `${round(measurement.waist)} cm` } : null,
    measurement.body_fat != null ? { label: 'Body fat', value: `${round(measurement.body_fat)}%` } : null,
  ].filter((value): value is { label: string; value: string } => Boolean(value)).slice(0, 3);
}

function describeWeightProgress(start?: number | null, current?: number | null, target?: number | null) {
  if (start == null || current == null || target == null) return 'Complete your assessment and coach check-ins to track progress toward a weight target.';
  if (start === target) return current === target ? 'You are at the target recorded in your assessment.' : 'Your target matches your starting weight; current change is shown without a directional score.';

  const direction = target > start ? 1 : -1;
  const movedTowardTarget = (current - start) * direction;
  const remaining = (target - current) * direction;
  const action = direction > 0 ? 'gained' : 'lost';

  if (movedTowardTarget < 0) return `${round(Math.abs(current - start))} kg moved away from the recorded target. Review the goal with your coach.`;
  if (remaining <= 0) return `Target reached or passed after ${round(Math.abs(current - start))} kg ${action}.`;
  if (movedTowardTarget === 0) return `${round(Math.abs(target - current))} kg to target.`;
  return `${round(Math.abs(current - start))} kg ${action} since start. ${round(Math.abs(target - current))} kg to target.`;
}

function groupPhotosByDate(photos: ProgressPhotoWithUrl[]) {
  const groups = new Map<string, ProgressPhotoWithUrl[]>();
  for (const photo of photos) groups.set(photo.taken_at, [...(groups.get(photo.taken_at) ?? []), photo]);
  return Array.from(groups.entries()).map(([date, groupPhotos]) => ({ date, photos: groupPhotos }));
}

function getComparison(photos: ProgressPhotoWithUrl[], pose: ProgressPhotoPose) {
  const matching = photos.filter((photo) => photo.pose === pose).sort((a, b) => a.taken_at.localeCompare(b.taken_at));
  if (matching.length < 2) return null;
  return { current: matching[matching.length - 1], start: matching[0] };
}

function getExtraFieldValue(key: (typeof extraMeasurementFields)[number][0], values: Record<(typeof extraMeasurementFields)[number][0], string>) {
  return values[key];
}

function getExtraFieldSetter(key: (typeof extraMeasurementFields)[number][0], setters: Record<`set${Capitalize<(typeof extraMeasurementFields)[number][0]>}`, (value: string) => void>) {
  const setterKey = `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof typeof setters;
  return setters[setterKey];
}

function parsePositive(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toCm(value: string, unit: LengthUnit) {
  const parsed = parsePositive(value);
  if (!parsed) return null;
  return unit === 'cm' ? parsed : Math.round(parsed * 2.54 * 10) / 10;
}

function normalizeDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) return null;
  return value;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return 'Unknown date';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function labelPose(pose: ProgressPhotoPose) {
  return pose.charAt(0).toUpperCase() + pose.slice(1);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

const styles = StyleSheet.create({
  sectionLabel: { ...typography.caption, fontWeight: '800', marginBottom: spacing.sm },
  currentStatus: { borderBottomWidth: 1, flexDirection: 'row', paddingBottom: spacing.lg },
  metric: { flex: 1, gap: spacing.xs },
  metricValue: { ...typography.h2 },
  metricLabel: { ...typography.caption, fontWeight: '600' },
  verticalDivider: { marginHorizontal: spacing.md, width: 1 },
  sectionBlock: { borderBottomWidth: 1, gap: spacing.md, paddingBottom: spacing.lg },
  goalTitle: { ...typography.h2 },
  goalMetrics: { flexDirection: 'row', gap: spacing.sm },
  smallMetric: { flex: 1, gap: spacing.xs, minWidth: 0 },
  smallMetricValue: { ...typography.h3 },
  supportingText: { ...typography.caption },
  inlineError: { ...typography.caption, marginBottom: spacing.md },
  chartSection: { borderBottomWidth: 1, marginHorizontal: -spacing.md, paddingBottom: spacing.lg },
  chart: { borderRadius: radius.sm },
  infoBanner: { alignItems: 'center', borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, padding: 12 },
  infoText: { ...typography.caption, flex: 1, fontWeight: '600' },
  latestMeasurement: { borderBottomWidth: 1, gap: spacing.md, paddingBottom: spacing.lg },
  latestHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  recordCount: { ...typography.caption, fontWeight: '800' },
  measurementValues: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  form: { gap: spacing.md, marginBottom: spacing.md },
  formTitle: { ...typography.h3 },
  inputRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1 },
  suffix: { ...typography.body, marginBottom: spacing.md, width: 38 },
  photoForm: { gap: spacing.md, marginBottom: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoGroup: { gap: spacing.sm, marginBottom: spacing.lg },
  dateTitle: { ...typography.caption, fontWeight: '700' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoTile: { gap: spacing.xs },
  photoImage: { aspectRatio: 1, borderRadius: radius.sm, width: '100%' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoLabel: { ...typography.caption, fontWeight: '700' },
  comparisonSection: { gap: spacing.md, marginBottom: spacing.lg },
  compareRow: { flexDirection: 'row', gap: spacing.sm },
  comparePanel: { flex: 1, gap: spacing.xs, minWidth: 0 },
  compareImage: { aspectRatio: 0.75, borderRadius: radius.sm, width: '100%' },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.64)', flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '94%', padding: spacing.lg },
  modalScroll: { paddingBottom: spacing.md },
  detailImage: { aspectRatio: 0.8, borderRadius: radius.lg, marginBottom: spacing.md, width: '100%' },
  notes: { ...typography.body, marginTop: spacing.md },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  flex: { flex: 1 },
});
