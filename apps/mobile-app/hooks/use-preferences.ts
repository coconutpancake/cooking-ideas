import { useCallback, useEffect, useState } from 'react';

import {
  getLocalProfile,
  getMealPreference,
  getUserPreferences,
  saveLocalProfile,
  saveMealPreference,
  saveUserPreferences,
} from '@/lib/storage';
import type { LocalProfile, MealPreferenceKey, UserPreferences } from '@/lib/types';

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [mealPreference, setMealPreference] = useState<MealPreferenceKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedPreferences, storedProfile, storedMealPreference] = await Promise.all([
        getUserPreferences(),
        getLocalProfile(),
        getMealPreference(),
      ]);
      setPreferences(storedPreferences);
      setProfile(storedProfile);
      setMealPreference(storedMealPreference);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePreferences = useCallback(
    async (next: Omit<UserPreferences, 'updatedAt'>) => {
      setIsSaving(true);
      try {
        const saved = await saveUserPreferences(next);
        setPreferences(saved);
        return saved;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(async (next: Pick<LocalProfile, 'nickname' | 'avatarUri'>) => {
    setIsSaving(true);
    try {
      const saved = await saveLocalProfile(next);
      setProfile(saved);
      return saved;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateMealPreference = useCallback(async (next: MealPreferenceKey | null) => {
    setMealPreference(next);
    await saveMealPreference(next);
  }, []);

  return {
    preferences,
    profile,
    mealPreference,
    isLoading,
    isSaving,
    reload: load,
    updatePreferences,
    updateProfile,
    updateMealPreference,
  };
}
