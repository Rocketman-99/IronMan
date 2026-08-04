import { type UserProfile, type TrainingPlan } from '../../types';
import { getAIClient } from './client';
import { AI_MODELS } from '../../config/api';
import { t } from '../../i18n/ko';
import { type TrainingContext, ALL_SPORTS } from './context';

/** 스트리밍 중 받은 글자 수를 흘려보낸다. 화면의 진행 표시가 이걸 쓴다. */
export type ProgressFn = (charsReceived: number) => void;

export async function generateTrainingPlan(
  profile: UserProfile,
  context: TrainingContext,
  onProgress?: ProgressFn
): Promise<TrainingPlan> {
  const client = await getAIClient();

  // 고른 종목이 3종 전부가 아니면 "부족한 종목을 보완하라"는 기존 지시와 정면으로
  // 충돌한다. 러닝만 골랐는데 수영 세션이 끼는 게 그 탓이었다.
  const focus = context.focus;
  const isNarrowed = !!focus && focus.length < ALL_SPORTS.length;
  const focusRule = isNarrowed
    ? `- 사용자는 ${focus!.map((s) => t.sport[s]).join(', ')} 에 집중하기로 했습니다.
  **모든 세션을 이 종목으로만 구성하세요.** 고르지 않은 종목은 계획에 넣지 마세요.
  다만 회복이나 보조 운동이 꼭 필요하면 설명(description)에서만 언급하세요.`
    : '- 종목 균형이 무너져 있으면 부족한 종목을 보완하세요.';

  const prompt = `당신은 전문 트라이애슬론 코치입니다.

${context.prompt}

위 데이터를 종합해 4주 트레이닝 계획을 세우세요. 특히:
- 설정한 목표(특히 레이스 종류와 남은 기간)에 맞춰 주차별 초점을 정하세요.
- 최근 훈련량 추이와 ACWR을 보고 무리하지 않게 증량하세요.
${focusRule}
- 주간 훈련 가능 시간 안에서 실행 가능한 계획을 세우세요.

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

  // 8000 토큰짜리 응답은 스트리밍이 권장 방식이고, 진행 표시의 근거도 된다.
  const stream = client.messages.stream({
    model: AI_MODELS.deep,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    messages: [{ role: 'user', content: prompt }],
  });

  if (onProgress) {
    let chars = 0;
    stream.on('text', (delta: string) => {
      chars += delta.length;
      onProgress(chars);
    });
  }

  const response = await stream.finalMessage();
  const text = response.content.find((b) => b.type === 'text');
  const raw = text && text.type === 'text' ? text.text : '{}';

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as TrainingPlan;
  } catch {
    // 파싱 실패 시 아래 기본 계획으로 떨어진다
  }

  // 파싱이 실패해도 고르지 않은 종목이 튀어나오면 안 된다. 고른 종목을 돌려 쓴다.
  const pool = focus && focus.length > 0 ? focus : ALL_SPORTS;
  const pick = (i: number) => pool[i % pool.length];

  return {
    title: t.aiPrompt.planFallbackTitle,
    totalWeeks: 4,
    weeks: [
      { weekNumber: 1, focus: '기초 체력 구축', sessions: [{ day: '화요일', sport: pick(0), type: 'easy', duration: '30분', description: '가볍게 시작' }] },
      { weekNumber: 2, focus: '지구력 향상', sessions: [{ day: '화요일', sport: pick(1), type: 'base', duration: '45분', description: '저강도 지속' }] },
      { weekNumber: 3, focus: '인터벌 훈련', sessions: [{ day: '수요일', sport: pick(2), type: 'interval', duration: '40분', description: '인터벌 위주' }] },
      { weekNumber: 4, focus: '회복 및 정리', sessions: [{ day: '목요일', sport: pick(0), type: 'recovery', duration: '20분', description: '회복 위주' }] },
    ],
  };
}
