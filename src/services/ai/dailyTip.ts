import { type UserProfile, type WorkoutWithDetails } from '../../types';
import { getAIClient } from './client';
import { buildDailyTipPrompt } from './prompts';
import { AI_MODELS } from '../../config/api';

export async function getDailyTip(
  profile: UserProfile,
  recentWorkouts: WorkoutWithDetails[]
): Promise<string> {
  const client = await getAIClient();
  const prompt = buildDailyTipPrompt(profile, recentWorkouts);

  const response = await client.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '오늘도 훈련을 즐겁게 임해보세요!';
}
