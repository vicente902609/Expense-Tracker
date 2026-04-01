import type { CategoriesListResponse } from "@expense-tracker/shared";

import { apiRequest } from "@/api/client";

export type { CategoriesListResponse };

export const listCategories = () => apiRequest<CategoriesListResponse>("/categories");

export const addCustomCategory = (name: string, color?: string) =>
  apiRequest<CategoriesListResponse>("/categories", {
    method: "POST",
    body: color !== undefined ? { name, color } : { name },
  });

export const updateCustomCategory = (categoryId: string, body: { name?: string; color?: string | null }) =>
  apiRequest<CategoriesListResponse>(`/categories/${encodeURIComponent(categoryId)}`, { method: "PATCH", body });

export const deleteCustomCategory = (categoryId: string) =>
  apiRequest<CategoriesListResponse>(`/categories/${encodeURIComponent(categoryId)}`, { method: "DELETE" });
