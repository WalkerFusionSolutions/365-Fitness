import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AppInput, FilterChip, IconRow, ProgressBar, SectionHeader, StatCard } from '@/components/AppUI';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { UnitToggle } from '@/components/Questionnaire';
import { useAuth } from '@/hooks/useAuth';
import { useClientProgress } from '@/hooks/useProgress';
import { useAppTheme } from '@/hooks/useTheme';
import {
  ClientStackParamList,
  Measurement,
  ProgressPhotoPose,
  ProgressPhotoWithUrl,
  WeightUnit,
} from '@/types';
import { calculateProgressPercent } from '@/services/progress.service';
import { formatHeight, formatWeight, weightToKg } from '@/utils/fitness';
import { radius, spacing, typography } from '@/utils/theme';

type ProgressRoute = RouteProp<ClientStackParamList, 'ClientProgress' | 'CoachClientProgress'>;
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
  const route = useRoute<ProgressRoute>();
  const { profile } = useAuth();
  const params = route.params as { clientId?: string; clientName?: string } | undefined;
  const clientId = params?.clientId ?? profile?.id;
  const clientName = params?.clientName ?? profile?.full_name ?? 'Client';
  const isCoachView = Boolean(params?.clientId && params.clientId !== profile?.id);
  const canAddMeasurement = Boolean(clientId && (!isCoachView || profile?.role === 'coach'));
  const canManagePhotos = Boolean(clientId && profile?.role === 'client' && clientId === profile.id);
  const progress = useClientProgress(clientId);
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
  const screenWidth = Dimensions.get('window').width;

  useFocusEffect(
    React.useCallback(() => {
      progress.refresh();
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

  if (progress.isLoading) {
    return <LoadingView label="Loading progress..." />;
  }

  if (progress.error && !progress.data) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load progress"
          subtitle={progress.error}
          onRetry={progress.refresh}
        />
      </Screen>
    );
  }

  const data = progress.data;
  const progressPercent = calculateProgressPercent(
    data?.startingWeightKg,
    data?.currentWeightKg,
    data?.goalWeightKg
  );

  async function saveMeasurement() {
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

    if (
      !values.weight &&
      !values.bodyFat &&
      !values.chest &&
      !values.waist &&
      !values.hips &&
      !values.leftArm &&
      !values.rightArm &&
      !values.leftThigh &&
      !values.rightThigh &&
      !values.neck
    ) {
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

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={false} onRefresh={progress.refresh} />}
    >
      <AppHeader
        eyebrow={isCoachView ? 'CLIENT PROGRESS' : 'PROGRESS'}
        title={isCoachView ? clientName : 'Progress'}
        subtitle="Measurements, goals, and transformation photos."
      />

      {progress.error ? <Text style={[styles.inlineError, { color: colors.error }]}>{progress.error}</Text> : null}

      <View style={styles.statsRow}>
        <StatCard icon="scale-outline" label="Current" value={formatWeight(data?.currentWeightKg)} />
        <StatCard icon="flag-outline" label="Goal" value={formatWeight(data?.goalWeightKg)} tone="success" />
      </View>

      <Card style={styles.summaryCard}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Your Goal</Text>
        <Text style={[styles.goalTitle, { color: colors.primary }]}>
          {data?.assessment?.primaryGoal ?? 'No assessment yet'}
        </Text>
        <View style={styles.summaryGrid}>
          <MiniMetric label="Starting" value={formatWeight(data?.startingWeightKg)} />
          <MiniMetric label="Current" value={formatWeight(data?.currentWeightKg)} />
          <MiniMetric label="Target" value={formatWeight(data?.goalWeightKg)} />
        </View>
        {progressPercent != null ? <ProgressBar value={progressPercent} /> : null}
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatChange(data?.weightChangeKg)} since starting
          {data?.remainingToGoalKg != null ? ` • ${formatChange(data.remainingToGoalKg)} to goal` : ''}
        </Text>
      </Card>

      <SectionHeader title="Weight Trend" />
      <Card style={styles.chartCard}>
        {data && data.chartPoints.length >= 2 ? (
          <LineChart
            data={{
              labels: data.chartPoints.map((point) => point.label),
              datasets: [{ data: data.chartPoints.map((point) => point.weightKg) }],
            }}
            width={Math.max(280, screenWidth - spacing.lg * 4)}
            height={220}
            yAxisSuffix="kg"
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              color: () => colors.primary,
              decimalPlaces: 1,
              labelColor: () => colors.textSecondary,
              propsForBackgroundLines: {
                stroke: colors.border,
                strokeDasharray: '4',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <EmptyState
            icon="analytics-outline"
            title="More measurements needed"
            subtitle="Add at least two weight records to see a trend."
          />
        )}
      </Card>

      <SectionHeader title="Body Measurements" />
      {data && data.bodyChanges.length > 0 ? (
        <View style={styles.measurementGrid}>
          {data.bodyChanges.map((change) => (
            <Card key={change.key} style={styles.bodyCard}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{change.label}</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {formatBodyValue(change.current, change.unit)}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                Start {formatBodyValue(change.starting, change.unit)} • Change {formatSigned(change.change)} {change.unit}
              </Text>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="body-outline"
          title="No body measurements yet"
          subtitle="Waist, chest, body fat, and other records will appear here after they are saved."
        />
      )}

      {canAddMeasurement ? (
        <Card style={styles.form}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Add Measurement</Text>
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

      <SectionHeader title="Measurement History" />
      {data && data.measurements.length > 0 ? (
        <View style={styles.historyList}>
          {[...data.measurements].reverse().map((measurement) => (
            <MeasurementHistoryRow key={measurement.id} measurement={measurement} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="list-outline"
          title="No measurements yet"
          subtitle="Add your first measurement to start seeing progress over time."
        />
      )}

      <SectionHeader title="Progress Photos" />
      {canManagePhotos ? (
        <Card style={styles.form}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Add Photos</Text>
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
                <Pressable key={photo.id} onPress={() => setSelectedPhoto(photo)} style={styles.photoTile}>
                  {photo.signedUrl ? (
                    <Image source={{ uri: photo.signedUrl }} style={styles.photoImage} />
                  ) : (
                    <View style={[styles.photoFallback, { backgroundColor: colors.surfaceSecondary }]}>
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
        <EmptyState
          icon="images-outline"
          title="No progress photos yet"
          subtitle="Progress photos help you visually compare your journey over time."
        />
      )}

      <SectionHeader title="Compare Photos" />
      <Card style={styles.compareCard}>
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
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Add at least two {labelPose(comparePose).toLowerCase()} photos on different dates to compare.
          </Text>
        )}
      </Card>

      <PhotoDetail
        canDelete={canManagePhotos}
        isLoading={progress.isSaving}
        onClose={() => setSelectedPhoto(null)}
        onDelete={async (photo) => {
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

function MeasurementInput({
  label,
  onChangeText,
  suffix,
  value,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string;
}) {
  return (
    <View style={styles.inputRow}>
      <AppInput
        label={label}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        style={styles.input}
      />
      <Text style={styles.suffix}>{suffix}</Text>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.miniMetric}>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function MeasurementHistoryRow({ measurement }: { measurement: Measurement }) {
  const { colors } = useAppTheme();
  const details = [
    measurement.weight != null ? formatWeight(measurement.weight) : null,
    measurement.waist != null ? `${round(measurement.waist)} cm waist` : null,
    measurement.chest != null ? `${round(measurement.chest)} cm chest` : null,
    measurement.body_fat != null ? `${round(measurement.body_fat)}% body fat` : null,
  ].filter(Boolean);

  return (
    <IconRow
      icon="analytics-outline"
      title={formatDate(measurement.date)}
      subtitle={details.join(' • ') || 'Measurement saved'}
      right={<Text style={[styles.rowMeta, { color: colors.textMuted }]}>{measurement.notes ? 'Note' : ''}</Text>}
    />
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

function PhotoDetail({
  canDelete,
  isLoading,
  onClose,
  onDelete,
  photo,
}: {
  canDelete: boolean;
  isLoading: boolean;
  onClose: () => void;
  onDelete: (photo: ProgressPhotoWithUrl) => void;
  photo: ProgressPhotoWithUrl | null;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal animationType="slide" transparent visible={Boolean(photo)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          {photo ? (
            <ScrollView>
              {photo.signedUrl ? (
                <Image source={{ uri: photo.signedUrl }} style={styles.detailImage} />
              ) : (
                <View style={[styles.detailImage, styles.photoFallback, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                </View>
              )}
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{labelPose(photo.pose)}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatDate(photo.taken_at)}</Text>
              {photo.notes ? <Text style={[styles.notes, { color: colors.textPrimary }]}>{photo.notes}</Text> : null}
              <View style={styles.modalActions}>
                <Button label="Close" variant="secondary" onPress={onClose} />
                {canDelete ? (
                  <Button label="Delete" variant="outline" onPress={() => onDelete(photo)} loading={isLoading} />
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function groupPhotosByDate(photos: ProgressPhotoWithUrl[]) {
  const groups = new Map<string, ProgressPhotoWithUrl[]>();

  for (const photo of photos) {
    const key = photo.taken_at;
    groups.set(key, [...(groups.get(key) ?? []), photo]);
  }

  return Array.from(groups.entries()).map(([date, groupPhotos]) => ({ date, photos: groupPhotos }));
}

function getComparison(photos: ProgressPhotoWithUrl[], pose: ProgressPhotoPose) {
  const matching = photos
    .filter((photo) => photo.pose === pose)
    .sort((a, b) => a.taken_at.localeCompare(b.taken_at));

  if (matching.length < 2) return null;

  return {
    current: matching[matching.length - 1],
    start: matching[0],
  };
}

function getExtraFieldValue(
  key: (typeof extraMeasurementFields)[number][0],
  values: Record<(typeof extraMeasurementFields)[number][0], string>
) {
  return values[key];
}

function getExtraFieldSetter(
  key: (typeof extraMeasurementFields)[number][0],
  setters: Record<`set${Capitalize<(typeof extraMeasurementFields)[number][0]>}`, (value: string) => void>
) {
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
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function labelPose(pose: ProgressPhotoPose) {
  return pose.charAt(0).toUpperCase() + pose.slice(1);
}

function formatChange(value?: number | null) {
  if (value == null) return 'No change recorded';
  return `${formatSigned(round(value))} kg`;
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatBodyValue(value: number, unit: '%' | 'cm') {
  return `${round(value)}${unit === '%' ? '%' : ` ${unit}`}`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h3,
  },
  goalTitle: {
    ...typography.h2,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniMetric: {
    flex: 1,
    gap: spacing.xs,
  },
  metricValue: {
    ...typography.h3,
  },
  metricLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
  },
  inlineError: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  chartCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: radius.md,
  },
  measurementGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bodyCard: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
  },
  suffix: {
    ...typography.body,
    marginBottom: spacing.md,
    width: 38,
  },
  historyList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rowMeta: {
    ...typography.caption,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoGroup: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dateTitle: {
    ...typography.h3,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoTile: {
    width: '31%',
    gap: spacing.xs,
  },
  photoImage: {
    aspectRatio: 1,
    borderRadius: radius.md,
    width: '100%',
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  compareCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  compareRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  comparePanel: {
    flex: 1,
    gap: spacing.xs,
  },
  compareImage: {
    aspectRatio: 0.75,
    borderRadius: radius.md,
    width: '100%',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  detailImage: {
    aspectRatio: 0.8,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    width: '100%',
  },
  notes: {
    ...typography.body,
    marginTop: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
