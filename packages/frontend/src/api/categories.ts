import type { CategoriesListResponse, CustomCategoryApi } from "@expense-tracker/shared";

import { apiRequest } from "@/api/client";

export type { CategoriesListResponse };

export const listCategories = () => apiRequest<CategoriesListResponse>("/categories");

/** POST /categories — body `{ name, color }`; response is the created category (envelope unwrapped by client). */
export const addCustomCategory = (name: string, color: string) =>
  apiRequest<CustomCategoryApi>("/categories", {
    method: "POST",
    body: { name, color },
  });

export const updateCustomCategory = (categoryId: string, body: { name?: string; color?: string | null }) =>
  apiRequest<CategoriesListResponse>(`/categories/${encodeURIComponent(categoryId)}`, { method: "PATCH", body });

export const deleteCustomCategory = (categoryId: string) =>
  apiRequest<CategoriesListResponse>(`/categories/${encodeURIComponent(categoryId)}`, { method: "DELETE" });
