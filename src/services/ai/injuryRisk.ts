import { type UserProfile, type WorkoutWithDetails, type InjuryRiskAssessment } from '../../types';
import { getAIClient } from './client';
import { buildInjuryRiskPrompt } from './prompts';
import { AI_MODELS } from '../../config/api';

export async function assessInjuryRisk(
  profile: UserProfile,
  last30DaysWorkouts: WorkoutWithDetails[]
): Promise<InjuryRiskAssessment> {
  const client = await getAIClient();
  const prompt = buildInjuryRiskPrompt(profile, last30DaysWorkouts);

  const response = await client.messages.create({
    model: AI_MODELS.sonnet,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InjuryRiskAssessment;
    }
  } catch {
    // fallback
  }

  return {
    overallRisk: 20,
    concerns: [],
    recommendations: ['규칙적인 훈련을 계속하세요.', '수면과 영양 관리에 신경 쓰세요.'],
    summary: '데이터 분석에 어려움이 있었습니다. 현재 훈련을 계속 유지하세요.',
  };
}
