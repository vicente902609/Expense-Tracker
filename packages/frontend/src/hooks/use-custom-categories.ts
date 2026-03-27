import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addCustomCategory, deleteCustomCategory, listCustomCategories, renameCustomCategory } from "../api/categories.js";

export const useCustomCategories = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await listCustomCategories();
      return response.custom;
    },
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => addCustomCategory(name),
    onSuccess: (response) => {
      queryClient.setQueryData(["categories"], response.custom);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => renameCustomCategory(from, to),
    onSuccess: async (response) => {
      await queryClient.setQueryData(["categories"], response.custom);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteCustomCategory(name),
    onSuccess: async (response) => {
      await queryClient.setQueryData(["categories"], response.custom);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addCategory: async (name: string) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      await addMutation.mutateAsync(trimmed);
    },
    renameCategory: async (currentName: string, nextName: string) => {
      await renameMutation.mutateAsync({ from: currentName, to: nextName.trim() });
    },
    deleteCategory: async (name: string) => {
      await deleteMutation.mutateAsync(name);
    },
    addPending: addMutation.isPending,
    renamePending: renameMutation.isPending,
    deletePending: deleteMutation.isPending,
    addError: addMutation.error,
  };
};
