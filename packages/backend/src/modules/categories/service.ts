import type { CategoriesListResponse, CustomCategoryApi } from "@expense-tracker/shared";
import { addCustomCategorySchema, putCustomCategoryBodySchema } from "@expense-tracker/shared";
import { randomUUID } from "node:crypto";

import { AppError } from "../../lib/errors.js";
import { recategorizeExpenses } from "../expenses/repository.js";
import { recalculateGoalForecasts } from "../goals/service.js";
import { getUserCustomCategoryDocs, setUserCustomCategoryDocs, type UserCustomCategoryDoc } from "../users/repository.js";
import {
  getPredefinedNameLowerSet,
  listPredefinedCategoryDocuments,
} from "./predefined-categories.repository.js";

const DEFAULT_CUSTOM_COLOR = "#8e8e87";

const normalizeName = (value: string) => value.trim();

export const listCategories = async (userId: string) => {
  const [predefinedDocs, customDocs] = await Promise.all([listPredefinedCategoryDocuments(), getUserCustomCategoryDocs(userId)]);

  return {
    predefined: predefinedDocs.map((row) => ({
      categoryId: row.categoryId,
      name: row.name,
      color: row.color,
    })),
    custom: [...customDocs]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((row) => ({
        categoryId: row.categoryId,
        name: row.name,
        color: row.color ?? DEFAULT_CUSTOM_COLOR,
        createdAt: row.createdAt,
      })),
  };
};

/** POST /categories — creates one custom category; returns the created row (same shape as new-backend). */
export const addCustomCategory = async (userId: string, payload: unknown) => {
  const parsed = addCustomCategorySchema.parse(payload);
  const name = normalizeName(parsed.name);
  const color = parsed.color;
  const predefinedLower = await getPredefinedNameLowerSet();

  if (predefinedLower.has(name.toLowerCase())) {
    throw new AppError("That name is reserved for a built-in category.", 400);
  }

  const docs = await getUserCustomCategoryDocs(userId);

  if (docs.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) {
    throw new AppError("You already have a category with this name.", 409);
  }

  const now = new Date().toISOString();
  const next: UserCustomCategoryDoc = {
    categoryId: randomUUID(),
    name,
    color,
    createdAt: now,
  };

  await setUserCustomCategoryDocs(userId, [...docs, next]);

  return {
    categoryId: next.categoryId,
    name: next.name,
    color: next.color,
    createdAt: next.createdAt,
  };
};

export const updateCustomCategory = async (
  userId: string,
  categoryId: string,
  payload: unknown,
): Promise<CustomCategoryApi | CategoriesListResponse> => {
  const parsed = putCustomCategoryBodySchema.parse(payload);
  const docs = await getUserCustomCategoryDocs(userId);
  const index = docs.findIndex((entry) => entry.categoryId === categoryId);

  if (index === -1) {
    throw new AppError("Unknown custom category.", 404);
  }

  const current = docs[index]!;
  const nextName = normalizeName(parsed.name);
  const nextColor = parsed.color;
  const predefinedRows = await listPredefinedCategoryDocuments();
  const predefinedMatch = predefinedRows.find((row) => row.name.toLowerCase() === nextName.toLowerCase());

  if (predefinedMatch) {
    await recategorizeExpenses(userId, current.name, predefinedMatch.name);
    const filtered = docs.filter((_, i) => i !== index);
    await setUserCustomCategoryDocs(userId, filtered);
    await recalculateGoalForecasts(userId);
    return listCategories(userId);
  }

  const predefinedLower = await getPredefinedNameLowerSet();
  if (predefinedLower.has(nextName.toLowerCase())) {
    throw new AppError("That name is reserved for a built-in category.", 400);
  }

  if (docs.some((entry, i) => i !== index && entry.name.toLowerCase() === nextName.toLowerCase())) {
    throw new AppError("You already have a category with this name.", 409);
  }

  if (nextName !== current.name) {
    await recategorizeExpenses(userId, current.name, nextName);
  }

  const updated: UserCustomCategoryDoc = {
    categoryId: current.categoryId,
    name: nextName,
    color: nextColor,
    createdAt: current.createdAt,
  };

  const nextDocs = docs.map((entry, i) => (i === index ? updated : entry));
  await setUserCustomCategoryDocs(userId, nextDocs);
  await recalculateGoalForecasts(userId);
  return {
    categoryId: updated.categoryId,
    name: updated.name,
    color: updated.color ?? DEFAULT_CUSTOM_COLOR,
    createdAt: updated.createdAt,
  };
};

export const deleteCustomCategory = async (userId: string, categoryId: string) => {
  const docs = await getUserCustomCategoryDocs(userId);
  const found = docs.find((entry) => entry.categoryId === categoryId);

  if (!found) {
    throw new AppError("Unknown custom category.", 404);
  }

  await recategorizeExpenses(userId, found.name, "Other");
  await setUserCustomCategoryDocs(
    userId,
    docs.filter((entry) => entry.categoryId !== categoryId),
  );
  await recalculateGoalForecasts(userId);
  return { categoryId };
};
