// @kurate/icons — shared SVG assets for web and mobile
//
// Usage:
//   import GoogleIcon from '@kurate/icons/src/platform/google.svg';
//   import BrandStar from '@kurate/icons/src/brand/brand-star.svg';
//   import HeartIcon from '@kurate/icons/src/ui/heart.svg';
//
// Web: imported via @svgr/webpack as React components
// Mobile: imported via react-native-svg-transformer as RN components

export const ICON_CATEGORIES = {
  brand: [
    'brand-star',
    'brand-circle',
    'brand-arch',
    'brand-concentric-arch',
    'brand-sunburst',
    'checkmark',
    'cross',
    'arrow',
  ],
  platform: ['google', 'spotify', 'youtube', 'vimeo', 'apple-podcasts'],
  ui: [
    'bell',
    'bookmark',
    'camera',
    'check',
    'chevron-down',
    'chevron-left',
    'close',
    'copy',
    'dots-horizontal',
    'double-check',
    'exclamation-circle',
    'external-link',
    'eye',
    'eye-off',
    'heart',
    'heart-filled',
    'link',
    'log-out',
    'message-circle',
    'pen-line',
    'pencil',
    'plus',
    'reply',
    'search',
    'send',
    'share',
    'sliders',
    'smile',
    'star',
    'star-filled',
    'trash',
    'user-plus',
    'user-x',
    'users',
  ],
} as const;
