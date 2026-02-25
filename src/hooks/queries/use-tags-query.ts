"use client";

import { useQuery } from "@tanstack/react-query";
import { useDatabaseContext } from "@/contexts/database-provider";
import { queryKeys } from "@/lib/query-keys";

/**
 * Query hook to fetch all tags
 */
export function useTags() {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.tags(storageType),
    queryFn: () => storage.fetchTags(),
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query hook to fetch a single tag by ID
 */
export function useTag(id: string) {
  const { storage, storageType, isReady } = useDatabaseContext();

  return useQuery({
    queryKey: queryKeys.tag(storageType, id),
    queryFn: async () => {
      const tags = await storage.fetchTags();
      return tags.find((t) => t.id === id) || null;
    },
    enabled: isReady && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
