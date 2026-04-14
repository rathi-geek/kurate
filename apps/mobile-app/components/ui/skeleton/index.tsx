import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

type ISkeletonProps = React.ComponentProps<typeof View> & { className?: string };

const Skeleton = React.forwardRef<
  React.ComponentRef<typeof View>,
  ISkeletonProps
>(function Skeleton({ className, style, ...props }, ref) {
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      ref={ref as never}
      {...props}
      style={[animatedStyle, style]}
      className={cn('rounded-md bg-muted', className)}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };
