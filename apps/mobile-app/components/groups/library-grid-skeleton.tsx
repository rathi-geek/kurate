import React from 'react';
import { View } from '@/components/ui/view';
import { Skeleton } from '@/components/ui/skeleton';

export function LibraryGridSkeleton() {
  return (
    <View
      className="flex-row flex-wrap gap-2 p-4"
      style={{ paddingHorizontal: 12 }}
    >
      {[0, 1, 2, 3].map(i => (
        <Skeleton
          key={i}
          className="rounded-xl"
          style={{ width: '48%', aspectRatio: 9 / 12 }}
        />
      ))}
    </View>
  );
}
