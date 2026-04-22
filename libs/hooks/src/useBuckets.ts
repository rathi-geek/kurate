import { useCallback } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import type { Bucket, Database } from "@kurate/types";
import {
  MAX_BUCKETS,
  MAX_BUCKET_NAME_LENGTH,
  bucketSlug,
  nextBucketColor,
} from "@kurate/utils";

interface UseBucketsConfig {
  supabase: SupabaseClient<Database>;
  userId: string | null;
}

export function useBuckets({ supabase, userId }: UseBucketsConfig) {
  const queryClient = useQueryClient();

  const { data: buckets = [], isLoading } = useQuery<Bucket[]>({
    queryKey: queryKeys.thoughts.buckets(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buckets")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Bucket[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (label: string) => {
      if (!userId) throw new Error("Not authenticated");
      if (!label.trim()) throw new Error("BUCKET_NAME_REQUIRED");
      if (label.length > MAX_BUCKET_NAME_LENGTH) throw new Error("BUCKET_NAME_TOO_LONG");
      if (buckets.length >= MAX_BUCKETS) throw new Error("MAX_BUCKETS_REACHED");

      const slug = bucketSlug(label);
      if (buckets.some((b) => b.slug === slug)) throw new Error("BUCKET_NAME_DUPLICATE");

      const color = nextBucketColor(buckets.map((b) => b.color));
      const { data, error } = await supabase
        .from("buckets")
        .insert({ user_id: userId, slug, label: label.trim(), color })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Bucket;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.buckets() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.bucketSummaries() });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ bucketId, newLabel }: { bucketId: string; newLabel: string }) => {
      if (!newLabel.trim()) throw new Error("BUCKET_NAME_REQUIRED");
      if (newLabel.length > MAX_BUCKET_NAME_LENGTH) throw new Error("BUCKET_NAME_TOO_LONG");

      const newSlug = bucketSlug(newLabel);
      const existing = buckets.find((b) => b.slug === newSlug && b.id !== bucketId);
      if (existing) throw new Error("BUCKET_NAME_DUPLICATE");

      const bucket = buckets.find((b) => b.id === bucketId);
      if (!bucket) throw new Error("BUCKET_NOT_FOUND");
      if (bucket.is_system) throw new Error("CANNOT_MODIFY_SYSTEM_BUCKET");

      const oldSlug = bucket.slug;
      const { error } = await supabase
        .from("buckets")
        .update({ label: newLabel.trim(), slug: newSlug })
        .eq("id", bucketId);
      if (error) throw new Error(error.message);

      // Update all thoughts that reference the old slug
      if (oldSlug !== newSlug) {
        await supabase
          .from("thoughts")
          .update({ bucket: newSlug })
          .eq("user_id", userId!)
          .eq("bucket", oldSlug);

        // Update bucket_last_read
        await supabase
          .from("bucket_last_read")
          .update({ bucket: newSlug })
          .eq("user_id", userId!)
          .eq("bucket", oldSlug);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.buckets() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.bucketSummaries() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bucketId: string) => {
      const bucket = buckets.find((b) => b.id === bucketId);
      if (!bucket) throw new Error("BUCKET_NOT_FOUND");
      if (bucket.is_system) throw new Error("CANNOT_DELETE_SYSTEM_BUCKET");

      // Move all thoughts to "notes" first
      await supabase
        .from("thoughts")
        .update({ bucket: "notes", bucket_source: "user" })
        .eq("user_id", userId!)
        .eq("bucket", bucket.slug);

      // Delete the bucket_last_read entry
      await supabase
        .from("bucket_last_read")
        .delete()
        .eq("user_id", userId!)
        .eq("bucket", bucket.slug);

      // Delete the bucket
      const { error } = await supabase.from("buckets").delete().eq("id", bucketId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.buckets() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.bucketSummaries() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.all });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ bucketId, pinned }: { bucketId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("buckets")
        .update({ is_pinned: pinned })
        .eq("id", bucketId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.buckets() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.bucketSummaries() });
    },
  });

  const createBucket = useCallback(
    (label: string) => createMutation.mutateAsync(label),
    [createMutation],
  );

  const renameBucket = useCallback(
    (bucketId: string, newLabel: string) =>
      renameMutation.mutateAsync({ bucketId, newLabel }),
    [renameMutation],
  );

  const deleteBucket = useCallback(
    (bucketId: string) => deleteMutation.mutateAsync(bucketId),
    [deleteMutation],
  );

  const togglePin = useCallback(
    (bucketId: string, pinned: boolean) =>
      pinMutation.mutateAsync({ bucketId, pinned }),
    [pinMutation],
  );

  return {
    buckets,
    isLoading,
    createBucket,
    renameBucket,
    deleteBucket,
    togglePin,
    isCreating: createMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
