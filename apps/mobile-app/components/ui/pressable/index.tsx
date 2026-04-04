import React from 'react';
import { Pressable as RNPressable } from 'react-native';
import { cn } from '@/lib/utils';

type IPressableProps = React.ComponentProps<typeof RNPressable> & {
  className?: string;
};

const Pressable = React.forwardRef<
  React.ComponentRef<typeof RNPressable>,
  IPressableProps
>(function Pressable({ className, ...props }, ref) {
  return (
    <RNPressable
      {...props}
      ref={ref}
      className={cn(
        'data-[focus-visible=true]:outline-none data-[disabled=true]:opacity-40',
        className,
      )}
    />
  );
});

Pressable.displayName = 'Pressable';

export { Pressable };
