import React from 'react';
import { ActivityIndicator } from 'react-native';
import { cssInterop } from 'nativewind';
import { cn } from '@/lib/utils';

cssInterop(ActivityIndicator, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const Spinner = React.forwardRef<
  React.ComponentRef<typeof ActivityIndicator>,
  React.ComponentProps<typeof ActivityIndicator>
>(function Spinner(
  {
    className,
    color,
    focusable = false,
    'aria-label': ariaLabel = 'loading',
    ...props
  },
  ref,
) {
  return (
    <ActivityIndicator
      ref={ref}
      focusable={focusable}
      aria-label={ariaLabel}
      {...props}
      color={color}
      className={cn(className)}
    />
  );
});

Spinner.displayName = 'Spinner';

export { Spinner };
