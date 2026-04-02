import { v4 as uuidv4 } from 'uuid';
import type { CategoryItem, CustomCategory, PredefinedCategory } from '../models/category';
import {
  createCategory as createCategoryInDb,
  deleteCategoryByUser,
  getCategoryByUser,
  listCustomCategoriesByUser,
  listPredefinedCategories,
  updateCategoryByUser,
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

export const createCategory = async (
  userId: string,
  input: { name: string; color: string },
): Promise<CustomCategory> => {
  const categoryId = uuidv4();
  const createdAt = new Date().toISOString();

  const item: CategoryItem = {
    PK: `USER#${userId}`,
    SK: `CAT#${categoryId}`,
    categoryId,
    name: input.name,
    color: input.color,
    createdAt,
  };

  await createCategoryInDb(item);
  return { categoryId, name: input.name, color: input.color, createdAt };
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  input: { name: string; color: string },
): Promise<CustomCategory | null> => {
  const existing = await getCategoryByUser(userId, categoryId);
  if (!existing) return null;

  const updated = await updateCategoryByUser(userId, categoryId, input);
  return { categoryId: updated.categoryId, name: updated.name, color: updated.color, createdAt: updated.createdAt };
};

export const deleteCategory = async (userId: string, categoryId: string): Promise<boolean> => {
  const existing = await getCategoryByUser(userId, categoryId);
  if (!existing) return false;

  await deleteCategoryByUser(userId, categoryId);
  return true;
};
