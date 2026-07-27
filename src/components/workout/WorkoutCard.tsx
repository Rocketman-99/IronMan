import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type WorkoutWithDetails } from '../../types';
import { colors, sportColors, feelingEmojis } from '../../utils/theme';
import { t, sportLabels } from '../../i18n/ko';
import {
  formatWorkoutDate,
  formatDistanceKm,
  formatSwimDistance,
  formatDuration,
  formatPace,
  calcSpeedKmh,
} from '../../utils/formatters';

interface WorkoutCardProps {
  workout: WorkoutWithDetails;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const router = useRouter();
  const sportColor = sportColors[workout.sport_type as keyof typeof sportColors];

  function getPrimaryMetric(): string {
    if (workout.sport_type === 'swimming') {
      return formatSwimDistance(workout.distance_m);
    }
    return formatDistanceKm(workout.distance_m);
  }

  function getSecondaryMetric(): string {
    if (workout.sport_type === 'running' && workout.running?.avg_pace_sec_km) {
      return formatPace(workout.running.avg_pace_sec_km);
    }
    if (workout.sport_type === 'cycling') {
      const speed = workout.cycling?.avg_speed_kmh ??
        calcSpeedKmh(workout.distance_m, workout.duration_sec);
      return `${speed} km/h`;
    }
    return formatDuration(workout.duration_sec);
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: sportColor }]}
      onPress={() => router.push(`/workout/${workout.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.top}>
        <View style={styles.sportBadge}>
          <Ionicons
            name={
              workout.sport_type === 'running'
                ? 'fitness-outline'
                : workout.sport_type === 'swimming'
                ? 'water-outline'
                : 'bicycle-outline'
            }
            size={14}
            color={sportColor}
          />
          <Text style={[styles.sportLabel, { color: sportColor }]}>
            {sportLabels[workout.sport_type as keyof typeof sportLabels]}
          </Text>
        </View>
        <Text style={styles.date}>{formatWorkoutDate(workout.workout_date)}</Text>
        {workout.feeling && (
          <Text style={styles.feeling}>
            {feelingEmojis[workout.feeling as keyof typeof feelingEmojis]}
          </Text>
        )}
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{getPrimaryMetric()}</Text>
          <Text style={styles.metricLabel}>거리</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatDuration(workout.duration_sec)}</Text>
          <Text style={styles.metricLabel}>{t.log.duration}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{getSecondaryMetric()}</Text>
          <Text style={styles.metricLabel}>
            {workout.sport_type === 'running' ? '페이스' : workout.sport_type === 'cycling' ? '평균속도' : '소요시간'}
          </Text>
        </View>
      </View>

      {workout.avg_hr && (
        <View style={styles.footer}>
          <Ionicons name="heart-outline" size={12} color={colors.textMuted} />
          <Text style={styles.footerText}>{workout.avg_hr} bpm</Text>
          {workout.calories && (
            <>
              <Text style={styles.footerDot}>·</Text>
              <Ionicons name="flame-outline" size={12} color={colors.textMuted} />
              <Text style={styles.footerText}>{workout.calories} kcal</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  feeling: {
    fontSize: 16,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.divider,
    marginHorizontal: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 3,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  footerDot: {
    color: colors.textMuted,
    fontSize: 12,
    marginHorizontal: 4,
  },
});
