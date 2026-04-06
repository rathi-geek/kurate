import React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertStyle = cva(
  'flex-row items-start gap-2 rounded-lg border px-2.5 py-2',
  {
    variants: {
      variant: {
        default: 'border-border bg-card',
        destructive: 'border-destructive bg-card',
        solid: 'border-border bg-card',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const alertTextStyle = cva('flex-1 text-sm font-medium tracking-tight', {
  variants: {
    variant: {
      default: 'text-card-foreground',
      destructive: 'text-destructive',
      solid: 'text-card-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const alertIconStyle = cva('mt-0.5 h-4 w-4 fill-none', {
  variants: {
    variant: {
      default: 'text-card-foreground',
      destructive: 'text-destructive',
      solid: 'text-card-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const AlertContext = React.createContext<{
  variant?: 'default' | 'destructive' | 'solid' | null;
  action?: string;
}>({});

type IAlertProps = React.ComponentProps<typeof View> &
  VariantProps<typeof alertStyle> & {
    action?: string;
  };

const Alert = React.forwardRef<React.ComponentRef<typeof View>, IAlertProps>(
  function Alert({ className, variant = 'default', action, ...props }, ref) {
    return (
      <AlertContext.Provider value={{ variant, action }}>
        <View
          role="alert"
          className={cn(alertStyle({ variant }), className)}
          ref={ref}
          {...props}
        />
      </AlertContext.Provider>
    );
  },
);

type IAlertTextProps = React.ComponentProps<typeof Text>;

const AlertText = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IAlertTextProps
>(function AlertText({ className, ...props }, ref) {
  const { variant } = React.useContext(AlertContext);
  return (
    <Text
      className={cn(alertTextStyle({ variant }), className)}
      {...props}
      ref={ref}
    />
  );
});

type IAlertIconProps = React.ComponentProps<typeof View> & {
  className?: string;
};

const AlertIcon = React.forwardRef<
  React.ComponentRef<typeof View>,
  IAlertIconProps
>(function AlertIcon({ className, children, ...props }, ref) {
  const { variant } = React.useContext(AlertContext);
  return (
    <View
      className={cn(alertIconStyle({ variant }), className)}
      ref={ref}
      {...props}
    >
      {children}
    </View>
  );
});

Alert.displayName = 'Alert';
AlertText.displayName = 'AlertText';
AlertIcon.displayName = 'AlertIcon';

export { Alert, AlertText, AlertIcon };
