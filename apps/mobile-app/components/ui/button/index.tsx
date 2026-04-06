import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cssInterop } from 'nativewind';
import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';

const buttonStyle = cva(
  'h-fit flex-row items-center justify-center gap-2 rounded-[10px] data-[disabled=true]:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-primary data-[active=true]:bg-primary/90',
        destructive: 'bg-destructive data-[active=true]:bg-destructive/90',
        outline:
          'border border-border bg-background data-[active=true]:bg-accent',
        secondary:
          'bg-secondary text-secondary-foreground data-[active=true]:bg-secondary/80',
        ghost: 'data-[active=true]:bg-accent',
        link: 'text-primary underline-offset-4 data-[active=true]:underline',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'min-h-8 rounded-[10px] px-3 text-xs',
        lg: 'min-h-10 rounded-[10px] px-8',
        icon: 'min-h-9 min-w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextStyle = cva('font-sans', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary',
    },
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-sm',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type IButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonStyle> & { className?: string };

const Button = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  IButtonProps
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <TextClassContext.Provider value={buttonTextStyle({ variant, size })}>
      <Pressable
        ref={ref}
        role="button"
        {...props}
        className={cn(buttonStyle({ variant, size }), className)}
      />
    </TextClassContext.Provider>
  );
});

type IButtonTextProps = React.ComponentProps<typeof Text> &
  VariantProps<typeof buttonTextStyle> & { className?: string };

const ButtonText = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IButtonTextProps
>(({ className, ...props }, ref) => {
  const textClass = React.useContext(TextClassContext);
  return (
    <Text
      ref={ref}
      {...props}
      className={cn('font-sans', textClass, className)}
    />
  );
});

cssInterop(ActivityIndicator, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const ButtonSpinner = React.forwardRef<
  React.ComponentRef<typeof ActivityIndicator>,
  React.ComponentProps<typeof ActivityIndicator>
>(({ className, ...props }, ref) => {
  return (
    <ActivityIndicator
      ref={ref}
      {...props}
      className={cn('h-4 w-4', className)}
    />
  );
});

type IButtonIcon = {
  className?: string;
  as?: LucideIcon;
  size?: number;
};

const ButtonIcon = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  IButtonIcon
>(({ className, as: IconComponent, size = 16, ...props }, ref) => {
  const textClass = React.useContext(TextClassContext);
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={cn(
        'pointer-events-none shrink-0 fill-none',
        textClass,
        className,
      )}
      size={size}
    />
  );
});

Button.displayName = 'Button';
ButtonText.displayName = 'ButtonText';
ButtonSpinner.displayName = 'ButtonSpinner';
ButtonIcon.displayName = 'ButtonIcon';

export { Button, ButtonText, ButtonSpinner, ButtonIcon };
