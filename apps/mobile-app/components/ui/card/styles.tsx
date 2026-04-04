import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { isWeb } from '@gluestack-ui/utils/nativewind-utils';
const baseStyle = isWeb ? 'flex flex-col relative z-0' : '';

export const cardStyle = tva({
  base: `${baseStyle} flex-col rounded-xl border border-border bg-card shadow-sm`,
  variants: {
    size: {
      default: 'gap-6 p-4',
      sm: 'gap-3 p-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});
