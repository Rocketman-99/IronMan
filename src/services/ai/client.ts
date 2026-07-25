import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';

export const API_KEY_STORAGE_KEY = 'anthropic_api_key';

export async function getAPIKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveAPIKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
}

export async function removeAPIKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
}

export async function getAIClient(): Promise<Anthropic> {
  const apiKey = await getAPIKey();
  if (!apiKey) throw new Error('NO_API_KEY');
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}
