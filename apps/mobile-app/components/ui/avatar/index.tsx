'use client';
import { createAvatar } from '@gluestack-ui/core/avatar/creator';
import React from 'react';

import { Image, Text, View } from 'react-native';

import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { tva, withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
const SCOPE = 'AVATAR';

const UIAvatar = createAvatar({
  Root: withStyleContext(View, SCOPE),
  Badge: View,
  Group: View,
  Image: Image,
  FallbackText: Text,
});

const avatarStyle = tva({
  base: 'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted group-[.avatar-group]/avatar-group:-ml-2.5',
});

const avatarFallbackTextStyle = tva({
  base: 'text-transform:uppercase text-xs font-medium text-foreground',
});

const avatarGroupStyle = tva({
  base: 'group/avatar-group avatar-group relative flex-row-reverse',
});

const avatarBadgeStyle = tva({
  base: 'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500',
});

const avatarImageStyle = tva({
  base: 'absolute h-full w-full rounded-full',
});

type IAvatarProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIAvatar>,
  'context'
> &
  VariantProps<typeof avatarStyle>;

const Avatar = React.forwardRef<
  React.ComponentRef<typeof UIAvatar>,
  IAvatarProps
>(function Avatar({ className, ...props }, ref) {
  return (
    <UIAvatar
      ref={ref}
      {...props}
      className={avatarStyle({ class: className })}
      context={{}}
    />
  );
});

type IAvatarBadgeProps = React.ComponentPropsWithoutRef<typeof UIAvatar.Badge> &
  VariantProps<typeof avatarBadgeStyle>;

const AvatarBadge = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.Badge>,
  IAvatarBadgeProps
>(function AvatarBadge({ className, ...props }, ref) {
  return (
    <UIAvatar.Badge
      ref={ref}
      {...props}
      className={avatarBadgeStyle({ class: className })}
    />
  );
});

type IAvatarFallbackTextProps = React.ComponentPropsWithoutRef<
  typeof UIAvatar.FallbackText
> &
  VariantProps<typeof avatarFallbackTextStyle>;
const AvatarFallbackText = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.FallbackText>,
  IAvatarFallbackTextProps
>(function AvatarFallbackText({ className, ...props }, ref) {
  return (
    <UIAvatar.FallbackText
      ref={ref}
      {...props}
      className={avatarFallbackTextStyle({ class: className })}
    />
  );
});

type IAvatarImageProps = React.ComponentPropsWithoutRef<typeof UIAvatar.Image> &
  VariantProps<typeof avatarImageStyle>;

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.Image>,
  IAvatarImageProps
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <UIAvatar.Image
      ref={ref}
      {...props}
      className={avatarImageStyle({
        class: className,
      })}
      // @ts-expect-error - resizeMode is React Native specific
      resizeMode="cover"
    />
  );
});

type IAvatarGroupProps = React.ComponentPropsWithoutRef<typeof UIAvatar.Group> &
  VariantProps<typeof avatarGroupStyle>;

const AvatarGroup = React.forwardRef<
  React.ComponentRef<typeof UIAvatar.Group>,
  IAvatarGroupProps
>(function AvatarGroup({ className, ...props }, ref) {
  return (
    <UIAvatar.Group
      ref={ref}
      {...props}
      className={avatarGroupStyle({
        class: className,
      })}
    />
  );
});

// Alias for shadcn compatibility
const AvatarFallback = AvatarFallbackText;

export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarFallbackText,
  AvatarGroup,
  AvatarImage,
};
