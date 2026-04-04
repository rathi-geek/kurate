import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const vstackStyle = cva(
  'flex flex-col relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent items-stretch m-0 p-0 text-decoration-none',
  {
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
        true: 'flex-col-reverse',
      },
    },
  },
);

type IVStackProps = React.ComponentProps<'div'> &
  VariantProps<typeof vstackStyle>;

const VStack = React.forwardRef<React.ComponentRef<'div'>, IVStackProps>(
  function VStack({ className, space, reversed, ...props }, ref) {
    return (
      <div
        className={cn(vstackStyle({ space, reversed }), className)}
        {...props}
        ref={ref}
      />
    );
  },
);

VStack.displayName = 'VStack';

export { VStack };
