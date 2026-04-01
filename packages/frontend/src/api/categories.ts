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

/** PUT /categories/:id — body `{ name, color }`; usually returns updated row; merge-into-predefined returns full list. */
export const updateCustomCategory = (categoryId: string, body: { name: string; color: string }) =>
  apiRequest<CustomCategoryApi | CategoriesListResponse>(`/categories/${encodeURIComponent(categoryId)}`, {
    method: "PUT",
    body,
  });

/** DELETE /categories/:id — `{ categoryId }`. */
export const deleteCustomCategory = (categoryId: string) =>
  apiRequest<{ categoryId: string }>(`/categories/${encodeURIComponent(categoryId)}`, { method: "DELETE" });
