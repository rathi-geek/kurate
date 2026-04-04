import React from 'react';
import { Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textStyle = cva('font-body text-foreground', {
  variants: {
    isTruncated: { true: 'web:truncate' },
    bold: { true: 'font-bold' },
    underline: { true: 'underline' },
    strikeThrough: { true: 'line-through' },
    size: {
      '2xs': 'text-2xs',
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
    sub: { true: 'text-xs' },
    italic: { true: 'italic' },
    highlight: { true: 'bg-yellow-500' },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const TextClassContext = React.createContext<string | undefined>(
  undefined,
);

type ITextProps = React.ComponentProps<typeof RNText> &
  VariantProps<typeof textStyle>;

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(
  function Text(
    {
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      size = 'md',
      sub,
      italic,
      highlight,
      ...props
    },
    ref,
  ) {
    const textClass = React.useContext(TextClassContext);
    return (
      <RNText
        className={cn(
          textStyle({
            isTruncated: isTruncated as boolean,
            bold: bold as boolean,
            underline: underline as boolean,
            strikeThrough: strikeThrough as boolean,
            size,
            sub: sub as boolean,
            italic: italic as boolean,
            highlight: highlight as boolean,
          }),
          textClass,
          className,
        )}
        {...props}
        ref={ref}
      />
    );
  },
);

Text.displayName = 'Text';

export { Text };
