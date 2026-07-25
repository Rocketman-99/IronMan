export const AI_MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
} as const;

export const AI_LIMITS = {
  haikuCost: 0.5,
  sonnetCost: 2,
  dailyBudget: 15,
} as const;
