import { type UserProfile, type TrainingPlan, type WorkoutWithDetails } from '../../types';
import { getAIClient } from './client';
import { AI_MODELS } from '../../config/api';
import { profileSummary, workoutSummary } from './prompts';

export async function generateTrainingPlan(
  profile: UserProfile,
  recentWorkouts: WorkoutWithDetails[]
): Promise<TrainingPlan> {
  const client = await getAIClient();

  const prompt = `당신은 전문 트라이애슬론 코치입니다.

선수 프로필:
${profileSummary(profile)}

최근 운동 요약:
${recentWorkouts.slice(0, 14).map(workoutSummary).join('\n')}

위 데이터를 바탕으로 4주간 트레이닝 계획을 생성하세요.
엄격하게 아래 JSON 형식만 출력하세요 (markdown 문법 없이):
{
  "title": "계획 제목",
  "totalWeeks": 4,
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "이번 주 훈련 포커스",
      "sessions": [
        { "day": "월요일", "sport": "running", "type": "easy", "duration": "30분", "description": "세부 설명" }
      ]
    }
  ]
}`;

  const response = await client.messages.create({
    model: AI_MODELS.deep,
    // 4주 × 주별 세션까지 담으려면 2048로는 중간에 잘린다.
    max_tokens: 8000,
    // 계획을 세우기 전에 실제로 생각하게 한다 — 이게 얕은 계획의 주된 원인이었다.
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as TrainingPlan;
  } catch {}

  return {
    title: '4주 기초 트레이닝 계획',
    totalWeeks: 4,
    weeks: [
      { weekNumber: 1, focus: '기초 체력 구축', sessions: [{ day: '화요일', sport: 'running', type: 'easy', duration: '30분', description: '가벼운 러닝' }] },
      { weekNumber: 2, focus: '지구력 향상', sessions: [{ day: '화요일', sport: 'cycling', type: 'base', duration: '45분', description: '저강도 사이클' }] },
      { weekNumber: 3, focus: '인터벌 훈련', sessions: [{ day: '수요일', sport: 'swimming', type: 'drill', duration: '40분', description: '영법 개선 드릴' }] },
      { weekNumber: 4, focus: '회복 및 정리', sessions: [{ day: '목요일', sport: 'running', type: 'recovery', duration: '20분', description: '회복 조깅' }] },
    ],
  };
}
