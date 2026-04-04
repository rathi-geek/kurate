'use client';
import { createMenu } from '@gluestack-ui/core/menu/creator';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(ScrollView);

const menuStyle = tva({
  base: 'max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-hard-5',
});

const menuItemStyle = tva({
  base: 'min-w-[200px] flex-row items-center rounded p-3 data-[active=true]:bg-accent data-[disabled=true]:data-[focus=true]:bg-transparent data-[focus=true]:bg-accent data-[hover=true]:bg-accent data-[active=true]:text-accent-foreground data-[focus=true]:text-accent-foreground data-[hover=true]:text-accent-foreground data-[disabled=true]:opacity-40 data-[disabled=true]:web:cursor-not-allowed data-[focus-visible=true]:web:cursor-pointer data-[focus=true]:web:outline-none data-[focus-visible=true]:web:outline data-[focus-visible=true]:web:outline-2 data-[focus=true]:web:outline-0 data-[focus-visible=true]:web:outline-ring',
});

const menuBackdropStyle = tva({
  base: 'absolute bottom-0 left-0 right-0 top-0 web:cursor-default',
});

const menuSeparatorStyle = tva({
  base: 'h-px w-full bg-border',
});

const menuItemLabelStyle = tva({
  base: 'font-body font-normal text-popover-foreground',

  variants: {
    isTruncated: {
      true: 'web:truncate',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    sub: {
      true: 'text-xs',
    },
    italic: {
      true: 'italic',
    },
    highlight: {
      true: 'bg-yellow-500',
    },
  },
});

const BackdropPressable = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  React.ComponentPropsWithoutRef<typeof Pressable> &
    VariantProps<typeof menuBackdropStyle>
>(function BackdropPressable({ className, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      className={menuBackdropStyle({
        class: className,
      })}
      {...props}
    />
  );
});

type IMenuItemProps = VariantProps<typeof menuItemStyle> & {
  className?: string;
} & React.ComponentPropsWithoutRef<typeof Pressable>;

const Item = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  IMenuItemProps
>(function Item({ className, ...props }, ref) {
  return (
    <Pressable
      ref={ref}
      className={menuItemStyle({
        class: className,
      })}
      {...props}
    />
  );
});

const Separator = React.forwardRef<
  React.ComponentRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View> &
    VariantProps<typeof menuSeparatorStyle>
>(function Separator({ className, ...props }, ref) {
  return (
    <View
      ref={ref}
      className={menuSeparatorStyle({ class: className })}
      {...props}
    />
  );
});

cssInterop(AnimatedView, { className: 'style' });

export const UIMenu = createMenu({
  Root: AnimatedView,
  Item: Item,
  Label: Text,
  Backdrop: BackdropPressable,
  Separator: Separator,
});

type IMenuProps = React.ComponentProps<typeof UIMenu> &
  VariantProps<typeof menuStyle> & { className?: string };
type IMenuItemLabelProps = React.ComponentProps<typeof UIMenu.ItemLabel> &
  VariantProps<typeof menuItemLabelStyle> & { className?: string };

const Menu = React.forwardRef<React.ComponentRef<typeof UIMenu>, IMenuProps>(
  function Menu({ className, ...props }, ref) {
    return (
      <UIMenu
        entering={ZoomIn.duration(150).withInitialValues({
          transform: [{ scale: 0.9 }],
          opacity: 0,
        })}
        exiting={FadeOut.duration(150)}
        ref={ref}
        className={menuStyle({
          class: className,
        })}
        {...props}
      />
    );
  },
);

const MenuItem = UIMenu.Item;

const MenuItemLabel = React.forwardRef<
  React.ComponentRef<typeof UIMenu.ItemLabel>,
  IMenuItemLabelProps
>(function MenuItemLabel(
  {
    className,
    isTruncated,
    bold,
    underline,
    strikeThrough,
    sub,
    italic,
    highlight,
    ...props
  },
  ref,
) {
  return (
    <UIMenu.ItemLabel
      ref={ref}
      className={menuItemLabelStyle({
        isTruncated: isTruncated as boolean,
        bold: bold as boolean,
        underline: underline as boolean,
        strikeThrough: strikeThrough as boolean,
        sub: sub as boolean,
        italic: italic as boolean,
        highlight: highlight as boolean,
        class: className,
      })}
      {...props}
    />
  );
});

const MenuSeparator = UIMenu.Separator;

Menu.displayName = 'Menu';
MenuItem.displayName = 'MenuItem';
MenuItemLabel.displayName = 'MenuItemLabel';
MenuSeparator.displayName = 'MenuSeparator';
export { Menu, MenuItem, MenuItemLabel, MenuSeparator };
