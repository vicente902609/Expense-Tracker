import { addCustomCategorySchema, expenseCategoryValues, renameCustomCategorySchema } from "@expense-tracker/shared";

import { AppError } from "../../lib/errors.js";
import { recalculateGoalForecasts } from "../goals/service.js";
import { recategorizeExpenses } from "../expenses/repository.js";
import { getUserCustomCategories, setUserCustomCategories } from "../users/repository.js";

const predefinedLower = new Set(expenseCategoryValues.map((value) => value.toLowerCase()));

const normalizeName = (value: string) => value.trim();

const assertNotPredefined = (name: string) => {
  if (predefinedLower.has(name.toLowerCase())) {
    throw new AppError("That name is reserved for a built-in category.", 400);
  }
};

const resolveCustomName = (list: string[], name: string) => {
  const found = list.find((entry) => entry.toLowerCase() === name.toLowerCase());

  if (!found) {
    throw new AppError("Unknown custom category.", 404);
  }

  return found;
};

export const listCustomCategories = async (userId: string) => {
  const custom = await getUserCustomCategories(userId);
  return [...custom].sort((left, right) => left.localeCompare(right));
};

export const addCustomCategory = async (userId: string, payload: unknown) => {
  const { name: rawName } = addCustomCategorySchema.parse(payload);
  const name = normalizeName(rawName);
  assertNotPredefined(name);

  const list = await getUserCustomCategories(userId);

  if (list.some((entry) => entry.toLowerCase() === name.toLowerCase())) {
    throw new AppError("You already have a category with this name.", 409);
  }

  await setUserCustomCategories(userId, [...list, name]);
  return listCustomCategories(userId);
};

export const renameCustomCategory = async (userId: string, payload: unknown) => {
  const { from: rawFrom, to: rawTo } = renameCustomCategorySchema.parse(payload);
  const from = normalizeName(rawFrom);
  const to = normalizeName(rawTo);

  if (from === to) {
    throw new AppError("New name must differ from the current name.", 400);
  }

  const list = await getUserCustomCategories(userId);
  const fromCanonical = resolveCustomName(list, from);

  if (list.some((entry) => entry !== fromCanonical && entry.toLowerCase() === to.toLowerCase())) {
    throw new AppError("You already have a category with this name.", 409);
  }

  if (predefinedLower.has(to.toLowerCase())) {
    const predefinedName = expenseCategoryValues.find((value) => value.toLowerCase() === to.toLowerCase()) ?? to;
    await recategorizeExpenses(userId, fromCanonical, predefinedName);
    await setUserCustomCategories(
      userId,
      list.filter((entry) => entry !== fromCanonical),
    );
    await recalculateGoalForecasts(userId);
    return listCustomCategories(userId);
  }

  assertNotPredefined(to);

  await recategorizeExpenses(userId, fromCanonical, to);
  await setUserCustomCategories(
    userId,
    list.map((entry) => (entry === fromCanonical ? to : entry)),
  );

  await recalculateGoalForecasts(userId);
  return listCustomCategories(userId);
};

export const deleteCustomCategory = async (userId: string, name: string) => {
  const decoded = normalizeName(decodeURIComponent(name));
  const list = await getUserCustomCategories(userId);
  const canonical = resolveCustomName(list, decoded);

  await recategorizeExpenses(userId, canonical, "Other");
  await setUserCustomCategories(
    userId,
    list.filter((entry) => entry !== canonical),
  );

  await recalculateGoalForecasts(userId);
  return listCustomCategories(userId);
};
