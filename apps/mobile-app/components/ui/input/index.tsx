'use client';
import React from 'react';
import { createInput } from '@gluestack-ui/core/input/creator';
import { View, Pressable, TextInput } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import { cssInterop } from 'nativewind';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { UIIcon } from '@gluestack-ui/core/icon/creator';

const SCOPE = 'INPUT';

const UIInput = createInput({
  Root: withStyleContext(View, SCOPE),
  Icon: UIIcon,
  Slot: Pressable,
  Input: TextInput,
});

cssInterop(UIIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: 'classNameColor',
      stroke: true,
    },
  },
});

const inputStyle = tva({
  base: 'shadow-xs h-9 w-full flex-row items-center gap-2 overflow-hidden  rounded-[10px] border border-border bg-transparent px-3 transition-[color,box-shadow] data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[focus=true]:border-ring data-[invalid=true]:border-destructive/40 data-[disabled=true]:opacity-50 data-[focus=true]:outline-none data-[focus=true]:web:ring-[3px] data-[focus=true]:web:ring-ring/50 data-[invalid=true]:web:ring-destructive/20 dark:bg-input/30 dark:data-[focus=true]:border-ring dark:data-[invalid=true]:border-destructive/40 dark:data-[invalid=true]:web:ring-destructive/40',
});

const inputIconStyle = tva({
  base: 'h-4 w-4 items-center justify-center fill-none text-muted-foreground',
});

const inputSlotStyle = tva({
  base: 'items-center justify-center web:disabled:cursor-not-allowed',
});

const inputFieldStyle = tva({
  base: 'ios:leading-[0px] h-full flex-1 py-1 text-sm text-foreground placeholder:text-muted-foreground  web:cursor-text web:outline-none web:data-[disabled=true]:cursor-not-allowed md:text-sm',
});

type IInputProps = React.ComponentProps<typeof UIInput> &
  VariantProps<typeof inputStyle> & { className?: string };
const Input = React.forwardRef<React.ComponentRef<typeof UIInput>, IInputProps>(
  function Input({ className, ...props }, ref) {
    return (
      <UIInput
        ref={ref}
        {...props}
        className={inputStyle({ class: className })}
        context={{}}
      />
    );
  },
);

type IInputIconProps = React.ComponentProps<typeof UIInput.Icon> &
  VariantProps<typeof inputIconStyle> & {
    className?: string;
    height?: number;
    width?: number;
  };

const InputIcon = React.forwardRef<
  React.ComponentRef<typeof UIInput.Icon>,
  IInputIconProps
>(function InputIcon({ className, ...props }, ref) {
  return (
    <UIInput.Icon
      ref={ref}
      {...props}
      className={inputIconStyle({ class: className })}
    />
  );
});

type IInputSlotProps = React.ComponentProps<typeof UIInput.Slot> &
  VariantProps<typeof inputSlotStyle> & { className?: string };

const InputSlot = React.forwardRef<
  React.ComponentRef<typeof UIInput.Slot>,
  IInputSlotProps
>(function InputSlot({ className, ...props }, ref) {
  return (
    <UIInput.Slot
      ref={ref}
      {...props}
      className={inputSlotStyle({
        class: className,
      })}
    />
  );
});

type IInputFieldProps = React.ComponentProps<typeof UIInput.Input> &
  VariantProps<typeof inputFieldStyle> & { className?: string };

const InputField = React.forwardRef<
  React.ComponentRef<typeof UIInput.Input>,
  IInputFieldProps
>(function InputField({ className, ...props }, ref) {
  return (
    <UIInput.Input
      ref={ref}
      {...props}
      className={inputFieldStyle({
        class: className,
      })}
    />
  );
});

Input.displayName = 'Input';
InputIcon.displayName = 'InputIcon';
InputSlot.displayName = 'InputSlot';
InputField.displayName = 'InputField';

export { Input, InputField, InputIcon, InputSlot };
