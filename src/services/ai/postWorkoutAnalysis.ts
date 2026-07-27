import { type WorkoutWithDetails, type UserProfile, type PostWorkoutAnalysis } from '../../types';
import { getAIClient } from './client';
import { buildPostWorkoutPrompt } from './prompts';
import { AI_MODELS } from '../../config/api';

export async function analyzeWorkout(
  workout: WorkoutWithDetails,
  recentSameSport: WorkoutWithDetails[],
  profile: UserProfile
): Promise<PostWorkoutAnalysis> {
  const client = await getAIClient();
  const prompt = buildPostWorkoutPrompt(workout, recentSameSport, profile);

  const response = await client.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as PostWorkoutAnalysis;
    }
  } catch {
    // fallback
  }

  return {
    headline: '훈련 완료!',
    performance: text.slice(0, 200),
    recovery: '충분한 휴식을 취하세요.',
    nextFocus: '다음 훈련도 화이팅!',
    warning: null,
  };
}
