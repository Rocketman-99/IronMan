import { type Message, type UserProfile, type WorkoutWithDetails } from '../../types';
import { getAIClient } from './client';
import { buildCoachSystemPrompt } from './prompts';
import { AI_MODELS } from '../../config/api';

export async function sendChatMessage(
  messages: Message[],
  profile: UserProfile,
  recentWorkouts: WorkoutWithDetails[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const client = await getAIClient();
  const systemPrompt = buildCoachSystemPrompt(profile, recentWorkouts);

  let fullText = '';

  const stream = await client.messages.create({
    model: AI_MODELS.haiku,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text;
      onChunk(event.delta.text);
    }
  }

  return fullText;
}
