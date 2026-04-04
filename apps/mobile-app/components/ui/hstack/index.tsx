import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hstackStyle = cva('flex-row', {
  variants: {
    space: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-5',
      '2xl': 'gap-6',
      '3xl': 'gap-7',
      '4xl': 'gap-8',
    },
    reversed: {
      true: 'flex-row-reverse',
    },
  },
});

type IHStackProps = ViewProps & VariantProps<typeof hstackStyle>;

const HStack = React.forwardRef<React.ComponentRef<typeof View>, IHStackProps>(
  function HStack({ className, space, reversed, ...props }, ref) {
    return (
      <View
        className={cn(hstackStyle({ space, reversed }), className)}
        {...props}
        ref={ref}
      />
    );
  },
);

HStack.displayName = 'HStack';

export { HStack };
