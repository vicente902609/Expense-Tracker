import type { CustomCategory, PredefinedCategory } from '../models/category';
import {
  listCustomCategoriesByUser,
  listPredefinedCategories,
} from '../repositories/category.repository';

export interface CategoriesResult {
  predefined: PredefinedCategory[];
  custom: CustomCategory[];
}

export const listCategories = async (userId: string): Promise<CategoriesResult> => {
  const [predefinedItems, customItems] = await Promise.all([
    listPredefinedCategories(),
    listCustomCategoriesByUser(userId),
  ]);

  return {
    predefined: predefinedItems.map(({ categoryId, name, color }) => ({ categoryId, name, color })),
    custom: customItems.map(({ categoryId, name, color, createdAt }) => ({
      categoryId,
      name,
      color,
      createdAt,
    })),
  };
};
