import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@kurate/query";
import type { Database } from "@kurate/types";

interface UseMoveBucketConfig {
  supabase: SupabaseClient<Database>;
}

interface MoveBucketInput {
  thoughtId: string;
  newBucket: string;
}

export function useMoveBucket({ supabase }: UseMoveBucketConfig) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ thoughtId, newBucket }: MoveBucketInput) => {
      const { error } = await supabase
        .from("thoughts")
        .update({ bucket: newBucket, bucket_source: "user" })
        .eq("id", thoughtId);
      if (error) throw new Error(error.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.thoughts.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.thoughts.bucketSummaries(),
      });
    },
  });
}
