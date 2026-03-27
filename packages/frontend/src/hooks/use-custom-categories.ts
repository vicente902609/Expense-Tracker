import { useEffect, useState } from "react";

const storageKey = "expense-tracker-custom-categories";

const readCategories = () => {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
};

export const useCustomCategories = () => {
  const [categories, setCategories] = useState<string[]>(() => readCategories());

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: string) => {
    const nextCategory = category.trim();

    if (!nextCategory) {
      return;
    }

    setCategories((current) => (current.includes(nextCategory) ? current : [...current, nextCategory]));
  };

  const renameCategory = (currentName: string, nextName: string) => {
    const trimmedNextName = nextName.trim();

    if (!trimmedNextName || currentName === trimmedNextName) {
      return;
    }

    setCategories((current) => current.map((category) => (category === currentName ? trimmedNextName : category)));
  };

  const deleteCategory = (categoryToDelete: string) => {
    setCategories((current) => current.filter((category) => category !== categoryToDelete));
  };

  return {
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
  };
};
