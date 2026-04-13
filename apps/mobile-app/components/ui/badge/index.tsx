import React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeStyle = cva(
  'flex-row items-center rounded-[6px] px-2 py-0.5 self-start',
  {
    variants: {
      variant: {
        default: 'bg-secondary',
        muted: 'bg-muted',
        primary: 'bg-primary',
        accent: 'bg-accent',
        destructive: 'bg-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const badgeTextStyle = cva('font-sans text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary-foreground',
      accent: 'text-foreground',
      destructive: 'text-white',
    },
  },
  defaultVariants: { variant: 'default' },
});

type IBadgeProps = React.ComponentProps<typeof View> &
  VariantProps<typeof badgeStyle> & { className?: string };

const Badge = React.forwardRef<React.ComponentRef<typeof View>, IBadgeProps>(
  function Badge({ className, variant, ...props }, ref) {
    return (
      <View
        ref={ref}
        {...props}
        className={cn(badgeStyle({ variant }), className)}
      />
    );
  },
);

type IBadgeTextProps = React.ComponentProps<typeof Text> &
  VariantProps<typeof badgeTextStyle> & { className?: string };

const BadgeText = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IBadgeTextProps
>(function BadgeText({ className, variant, ...props }, ref) {
  return (
    <Text
      ref={ref}
      {...props}
      className={cn(badgeTextStyle({ variant }), className)}
    />
  );
});

Badge.displayName = 'Badge';
BadgeText.displayName = 'BadgeText';

export { Badge, BadgeText };
