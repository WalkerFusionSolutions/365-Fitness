import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { AppHeader, AppInput, Badge } from '@/components/AppUI';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useAppTheme } from '@/hooks/useTheme';
import {
  useExercise,
  useSaveExercise,
  useUploadExerciseVideo,
} from '@/hooks/useWorkout';
import { spacing, typography } from '@/utils/theme';

export default function CoachExerciseEditorScreen({ route, navigation }: any) {
  const { colors } = useAppTheme();
  const exerciseId = route.params?.exerciseId;
  const exercise = useExercise(exerciseId);
  const saveExercise = useSaveExercise();
  const uploadVideo = useUploadExerciseVideo();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('General');
  const [equipment, setEquipment] = useState('Bodyweight');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [videoPath, setVideoPath] = useState<string | null>(null);

  useEffect(() => {
    if (!exercise.data) return;

    setName(exercise.data.name);
    setMuscleGroup(exercise.data.muscle_group);
    setEquipment(exercise.data.equipment);
    setDescription(exercise.data.description ?? '');
    setInstructions(exercise.data.instructions);
    setVideoPath(exercise.data.video_path ?? null);
  }, [exercise.data]);

  if (exerciseId && exercise.isLoading) {
    return <LoadingView label="Loading exercise..." />;
  }

  if (exercise.error) {
    return (
      <Screen>
        <ErrorState
          title="Unable to load exercise"
          subtitle="Please try again."
          onRetry={exercise.refresh}
        />
      </Screen>
    );
  }

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      const asset = result.assets[0];
      const path = await uploadVideo.upload(asset.uri, asset.fileName ?? undefined);
      setVideoPath(path);
    } catch {
      Alert.alert('Unable to upload video', uploadVideo.error || 'Please try again.');
    }
  };

  const onSave = async () => {
    if (!name.trim() || !instructions.trim()) {
      Alert.alert('Missing details', 'Add an exercise name and instructions.');
      return;
    }

    try {
      await saveExercise.save({
        id: exerciseId,
        name,
        description,
        instructions,
        muscleGroup,
        equipment,
        videoPath,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Unable to save exercise', saveExercise.error || 'Please try again.');
    }
  };

  return (
    <Screen>
      <AppHeader
        title={exerciseId ? 'Edit Exercise' : 'Create Exercise'}
        subtitle="Keep cues clear for client training sessions."
        action={videoPath ? <Badge label="Video" /> : undefined}
      />
      <Card style={styles.form}>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Muscle Group" value={muscleGroup} onChangeText={setMuscleGroup} />
        <Field label="Equipment" value={equipment} onChangeText={setEquipment} />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label="Instructions"
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
        <Button
          label={videoPath ? 'Replace Video' : 'Upload Video'}
          variant="outline"
          onPress={pickVideo}
          loading={uploadVideo.isUploading}
        />
        {videoPath ? (
          <Text style={[styles.videoNote, { color: colors.textSecondary }]}>
            Video attached.
          </Text>
        ) : null}
      </Card>
      <Button
        label="Save Exercise"
        onPress={onSave}
        loading={saveExercise.isSaving}
        style={styles.saveButton}
      />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <>
      <AppInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  videoNote: {
    ...typography.caption,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
