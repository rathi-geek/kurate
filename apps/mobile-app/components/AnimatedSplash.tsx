import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import BrandConcentricArch from '@kurate/icons/brand/brand-concentric-arch.svg';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Hold briefly, then subtle zoom-in, then zoom-through + fade out
    scale.value = withSequence(
      withDelay(300, withSpring(1.15, { damping: 12, stiffness: 100 })),
      withDelay(
        200,
        withTiming(3, { duration: 400, easing: Easing.in(Easing.quad) }),
      ),
    );
    opacity.value = withDelay(
      700,
      withTiming(0, { duration: 300 }, finished => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      className="items-center justify-center bg-background"
    >
      <Animated.View style={animatedStyle} className="items-center gap-3">
        <BrandConcentricArch width={64} height={48} color="#2b5b7e" />
        <Animated.Text
          style={{ fontFamily: 'DMSans_700Bold' }}
          className="text-2xl tracking-tight text-foreground"
        >
          kurate
        </Animated.Text>
      </Animated.View>
    </View>
  );
}
