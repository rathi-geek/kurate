import React from 'react';
import { View, TextInput } from 'react-native';
import { cn } from '@/lib/utils';

type ITextareaProps = React.ComponentProps<typeof View> & {
  className?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
};

const TextareaContext = React.createContext<{
  isDisabled?: boolean;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
}>({ isFocused: false, setIsFocused: () => {} });

const Textarea = React.forwardRef<
  React.ComponentRef<typeof View>,
  ITextareaProps
>(function Textarea({ className, isDisabled, isInvalid, ...props }, ref) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TextareaContext.Provider value={{ isDisabled, isFocused, setIsFocused }}>
      <View
        ref={ref}
        {...props}
        className={cn(
          'min-h-20 w-full rounded-[10px] border border-border bg-transparent px-3 py-2',
          isFocused && 'border-ring',
          isInvalid && 'border-destructive/40',
          isDisabled && 'pointer-events-none opacity-50',
          className,
        )}
      />
    </TextareaContext.Provider>
  );
});

type ITextareaFieldProps = React.ComponentProps<typeof TextInput> & {
  className?: string;
};

const TextareaField = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  ITextareaFieldProps
>(function TextareaField({ className, ...props }, ref) {
  const { isDisabled, setIsFocused } = React.useContext(TextareaContext);

  return (
    <TextInput
      ref={ref}
      editable={!isDisabled}
      multiline
      textAlignVertical="top"
      onFocus={e => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={e => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
      className={cn(
        'flex-1 text-sm text-foreground placeholder:text-muted-foreground',
        className,
      )}
    />
  );
});

Textarea.displayName = 'Textarea';
TextareaField.displayName = 'TextareaField';

export { Textarea, TextareaField };
