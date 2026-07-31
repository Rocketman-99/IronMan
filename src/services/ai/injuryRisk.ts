import { type UserProfile, type InjuryRiskAssessment } from '../../types';
import { getAIClient } from './client';
import { AI_MODELS } from '../../config/api';
import { t } from '../../i18n/ko';
import { type TrainingContext } from './context';
import { type ProgressFn } from './trainingPlan';

export async function assessInjuryRisk(
  _profile: UserProfile,
  context: TrainingContext,
  onProgress?: ProgressFn
): Promise<InjuryRiskAssessment> {
  const client = await getAIClient();

  const prompt = `트라이애슬론 운동의학 전문가로서 부상 위험을 평가해주세요.

${context.prompt}

평가 시 다음을 근거로 삼으세요:
- 급성:만성 부하비율(ACWR) — 1.5를 넘으면 급격한 증량으로 봅니다.
- 주차별 훈련량 추이와 회복일 확보 여부
- 종목 편중 (한 종목에 부하가 몰렸는지)
- 평균 컨디션 점수의 하락 추세
- 목표 레이스까지 남은 기간 대비 현재 부하

다음 JSON으로 응답해주세요 (한국어):
{
  "overallRisk": 0-100 사이 정수,
  "concerns": ["우려 사항1", "우려 사항2"],
  "recommendations": ["권장 조치1", "권장 조치2", "권장 조치3"],
  "summary": "종합 의견 2-3문장"
}`;

  const stream = client.messages.stream({
    model: AI_MODELS.deep,
    max_tokens: 4000,
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
  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as InjuryRiskAssessment;
    }
  } catch {
    // 파싱 실패 시 아래 기본값
  }

  return {
    overallRisk: 20,
    concerns: [],
    recommendations: ['규칙적인 훈련을 계속하세요.', '수면과 영양 관리에 신경 쓰세요.'],
    summary: t.aiPrompt.injuryFallback,
  };
}
