import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { cssInterop } from 'nativewind';
import type { LucideIcon } from 'lucide-react-native';

type IInputProps = React.ComponentProps<typeof View> & {
  className?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
};

const InputContext = React.createContext<{
  isDisabled?: boolean;
  isInvalid?: boolean;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
}>({ isFocused: false, setIsFocused: () => {} });

const Input = React.forwardRef<React.ComponentRef<typeof View>, IInputProps>(
  function Input({ className, isDisabled, isInvalid, ...props }, ref) {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <InputContext.Provider
        value={{ isDisabled, isInvalid, isFocused, setIsFocused }}
      >
        <View
          ref={ref}
          {...props}
          className={cn(
            'h-9 w-full flex-row items-center gap-2 overflow-hidden rounded-[10px] border border-border bg-transparent px-3',
            isFocused && 'border-ring',
            isInvalid && 'border-destructive/40',
            isDisabled && 'pointer-events-none opacity-50',
            className,
          )}
        />
      </InputContext.Provider>
    );
  },
);

type IInputFieldProps = React.ComponentProps<typeof TextInput> & {
  className?: string;
};

const InputField = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  IInputFieldProps
>(function InputField({ className, ...props }, ref) {
  const { isDisabled, setIsFocused } = React.useContext(InputContext);

  return (
    <TextInput
      ref={ref}
      editable={!isDisabled}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
      className={cn(
        'ios:leading-[0px] h-full flex-1 py-1 text-sm text-foreground placeholder:text-muted-foreground',
        className,
      )}
    />
  );
});

type IInputSlotProps = React.ComponentProps<typeof Pressable> & {
  className?: string;
};

const InputSlot = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  IInputSlotProps
>(function InputSlot({ className, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      {...props}
      className={cn('items-center justify-center', className)}
    />
  );
});

type IInputIconProps = {
  className?: string;
  as?: LucideIcon;
  size?: number;
};

const InputIcon = ({ className, as: IconComponent, size = 16 }: IInputIconProps) => {
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={cn('h-4 w-4 items-center justify-center fill-none text-muted-foreground', className)}
      size={size}
    />
  );
};

Input.displayName = 'Input';
InputField.displayName = 'InputField';
InputSlot.displayName = 'InputSlot';
InputIcon.displayName = 'InputIcon';

export { Input, InputField, InputIcon, InputSlot };
