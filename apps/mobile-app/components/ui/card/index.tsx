import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

type ICardProps = React.ComponentProps<typeof View> & { className?: string };

const Card = React.forwardRef<React.ComponentRef<typeof View>, ICardProps>(
  function Card({ className, ...props }, ref) {
    return (
      <View
        ref={ref}
        {...props}
        className={cn(
          'rounded-xl border border-border bg-card shadow-sm',
          className,
        )}
      />
    );
  },
);

const CardHeader = React.forwardRef<
  React.ComponentRef<typeof View>,
  ICardProps
>(function CardHeader({ className, ...props }, ref) {
  return (
    <View
      ref={ref}
      {...props}
      className={cn('flex-col gap-1 p-4', className)}
    />
  );
});

const CardBody = React.forwardRef<React.ComponentRef<typeof View>, ICardProps>(
  function CardBody({ className, ...props }, ref) {
    return <View ref={ref} {...props} className={cn('p-4', className)} />;
  },
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';

export { Card, CardHeader, CardBody };
