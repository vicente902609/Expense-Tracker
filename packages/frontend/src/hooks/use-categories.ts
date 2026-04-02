import type { CategoriesListResponse, CustomCategoryApi } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addCustomCategory, deleteCustomCategory, listCategories, updateCustomCategory } from "@/api/categories";
import { buildCategoryPalette } from "@/lib/expense-ui";

export const useCategories = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const data = query.data ?? { predefined: [], custom: [] };
  const categoryPalette = buildCategoryPalette(data.predefined, data.custom);

  const addMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => addCustomCategory(name, color),
    onSuccess: (created: CustomCategoryApi) => {
      queryClient.setQueryData(["categories"], (old: CategoriesListResponse | undefined) => {
        const prev = old ?? { predefined: [], custom: [] };
        const custom = [...prev.custom, created].sort((a, b) => a.name.localeCompare(b.name));
        return { ...prev, custom };
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, body }: { categoryId: string; body: { name: string; color: string } }) =>
      updateCustomCategory(categoryId, body),
    onSuccess: async (data) => {
      if ("predefined" in data) {
        queryClient.setQueryData(["categories"], data);
      } else {
        queryClient.setQueryData(["categories"], (old: CategoriesListResponse | undefined) => {
          const prev = old ?? { predefined: [], custom: [] };
          const custom = prev.custom
            .map((c) => (c.categoryId === data.categoryId ? data : c))
            .sort((a, b) => a.name.localeCompare(b.name));
          return { ...prev, custom };
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCustomCategory(categoryId),
    onSuccess: async (_, deletedId) => {
      queryClient.setQueryData(["categories"], (old: CategoriesListResponse | undefined) => {
        const prev = old ?? { predefined: [], custom: [] };
        return {
          ...prev,
          custom: prev.custom.filter((c) => c.categoryId !== deletedId),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return {
    predefined: data.predefined,
    custom: data.custom,
    categoryPalette,
    isLoading: query.isLoading,
    error: query.error,
    addCategory: async (name: string, color: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      await addMutation.mutateAsync({ name: trimmed, color });
    },
    updateCategory: async (categoryId: string, body: { name: string; color: string }) => {
      await updateMutation.mutateAsync({ categoryId, body });
    },
    deleteCategory: async (categoryId: string) => {
      await deleteMutation.mutateAsync(categoryId);
    },
    addPending: addMutation.isPending,
    updatePending: updateMutation.isPending,
    deletePending: deleteMutation.isPending,
    addError: addMutation.error,
  };
};
