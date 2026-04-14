import React from 'react';
import { cssInterop } from 'nativewind';
import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';
import type { LucideIcon, LucideProps } from 'lucide-react-native';

const sizeMap: Record<string, number> = {
  '2xs': 12,
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

type IconProps = Omit<LucideProps, 'ref'> & {
  as: LucideIcon;
  size?: keyof typeof sizeMap | number;
  className?: string;
};

function IconImpl({
  as: IconComponent,
  ...props
}: Omit<LucideProps, 'ref'> & { as: LucideIcon }) {
  return <IconComponent {...props} />;
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: 'size',
      width: 'size',
      color: true,
      fill: true,
    },
  },
});

const Icon = React.forwardRef<React.ComponentRef<typeof IconImpl>, IconProps>(
  function Icon({ as: IconComponent, className, size = 'md', ...props }, ref) {
    const textClass = React.useContext(TextClassContext);
    const resolvedSize =
      typeof size === 'number' ? size : (sizeMap[size] ?? 18);

    return (
      <IconImpl
        as={IconComponent}
        className={cn(
          'pointer-events-none fill-none text-foreground',
          textClass,
          className,
        )}
        size={resolvedSize}
        {...props}
      />
    );
  },
);

export { Icon };
