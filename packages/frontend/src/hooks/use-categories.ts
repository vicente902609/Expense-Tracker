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
    mutationFn: ({ name, color }: { name: string; color?: string }) => addCustomCategory(name, color),
    onSuccess: (response) => {
      queryClient.setQueryData(["categories"], response);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, body }: { categoryId: string; body: { name?: string; color?: string | null } }) =>
      updateCustomCategory(categoryId, body),
    onSuccess: async (response) => {
      await queryClient.setQueryData(["categories"], response);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCustomCategory(categoryId),
    onSuccess: async (response) => {
      await queryClient.setQueryData(["categories"], response);
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
    addCategory: async (name: string, color?: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      await addMutation.mutateAsync({ name: trimmed, color });
    },
    updateCategory: async (categoryId: string, body: { name?: string; color?: string | null }) => {
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
