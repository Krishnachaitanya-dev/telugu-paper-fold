import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboarding_completed_v1';

export function useOnboardingState() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setCompleted(v === '1'));
  }, []);

  const complete = async (category: string) => {
    await AsyncStorage.setItem(KEY, '1');
    await AsyncStorage.setItem('onboarding_category', category);
    setCompleted(true);
  };

  return { completed, complete };
}

export async function getOnboardingCategory(): Promise<string | null> {
  return AsyncStorage.getItem('onboarding_category');
}
