import { addCustomCategorySchema, updateCustomCategoryBodySchema } from "@expense-tracker/shared";
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

export const addCustomCategory = async (userId: string, payload: unknown) => {
  const parsed = addCustomCategorySchema.parse(payload);
  const name = normalizeName(parsed.name);
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
    createdAt: now,
    ...(parsed.color ? { color: parsed.color } : {}),
  };

  await setUserCustomCategoryDocs(userId, [...docs, next]);
  return listCategories(userId);
};

export const updateCustomCategory = async (userId: string, categoryId: string, payload: unknown) => {
  const parsed = updateCustomCategoryBodySchema.parse(payload);
  const docs = await getUserCustomCategoryDocs(userId);
  const index = docs.findIndex((entry) => entry.categoryId === categoryId);

  if (index === -1) {
    throw new AppError("Unknown custom category.", 404);
  }

  const current = docs[index]!;
  const nextName = parsed.name !== undefined ? normalizeName(parsed.name) : current.name;
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

  const nameChanging = parsed.name !== undefined && nextName !== current.name;
  if (nameChanging) {
    await recategorizeExpenses(userId, current.name, nextName);
  }

  const colorPatch = parsed.color;
  const updated: UserCustomCategoryDoc = {
    categoryId: current.categoryId,
    name: nextName,
    createdAt: current.createdAt,
  };

  if (colorPatch === null) {
    /* omit color */
  } else if (colorPatch !== undefined) {
    updated.color = colorPatch;
  } else if (current.color) {
    updated.color = current.color;
  }

  const nextDocs = docs.map((entry, i) => (i === index ? updated : entry));
  await setUserCustomCategoryDocs(userId, nextDocs);
  await recalculateGoalForecasts(userId);
  return listCategories(userId);
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
  return listCategories(userId);
};
