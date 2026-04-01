import { apiRequest } from "@/api/client";

export type CategoriesResponse = {
  custom: string[];
};

export const listCustomCategories = () => apiRequest<CategoriesResponse>("/categories");

export const addCustomCategory = (name: string) =>
  apiRequest<CategoriesResponse>("/categories", { method: "POST", body: { name } });

export const renameCustomCategory = (from: string, to: string) =>
  apiRequest<CategoriesResponse>("/categories", { method: "PATCH", body: { from, to } });

export const deleteCustomCategory = (name: string) =>
  apiRequest<CategoriesResponse>(`/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
