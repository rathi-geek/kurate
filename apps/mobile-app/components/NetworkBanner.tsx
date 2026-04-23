import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, Wifi, WifiLow } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type BannerType = 'error' | 'warning' | 'success';

function getBannerConfig(type: BannerType) {
  switch (type) {
    case 'error':
      return { bg: '#b91c1c', icon: WifiOff, label: 'Offline' };
    case 'warning':
      return { bg: '#b45309', icon: WifiLow, label: 'Slow connection' };
    case 'success':
      return { bg: '#1a5c4b', icon: Wifi, label: 'Back online' };
  }
}

export function NetworkBanner() {
  const networkStatus = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);
  const previousConnectedRef = useRef(networkStatus.isConnected);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldShowBanner =
    !networkStatus.isConnected ||
    (networkStatus.isConnected && !networkStatus.isInternetReachable) ||
    networkStatus.hasSlowConnection;

  const getBannerType = (): BannerType => {
    if (!networkStatus.isConnected) return 'error';
    if (networkStatus.isConnected && !networkStatus.isInternetReachable)
      return 'warning';
    if (networkStatus.hasSlowConnection) return 'warning';
    return 'success';
  };

  const bannerType = getBannerType();
  const config = getBannerConfig(bannerType);
  const IconComponent = config.icon;

  const show = () => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 250 });
  };

  const hide = () => {
    translateY.value = withTiming(-60, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
  };

  useEffect(() => {
    const wasDisconnected = !previousConnectedRef.current;
    const isNowConnected =
      networkStatus.isConnected && networkStatus.isInternetReachable;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (shouldShowBanner) {
      show();
    } else if (wasDisconnected && isNowConnected) {
      show();
      hideTimerRef.current = setTimeout(() => {
        hide();
      }, 2000);
    } else {
      hide();
    }

    previousConnectedRef.current = networkStatus.isConnected;

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [
    shouldShowBanner,
    networkStatus.isConnected,
    networkStatus.isInternetReachable,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + 4 }, animatedStyle]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.badge, { backgroundColor: config.bg }]}>
        <IconComponent color="#ffffff" size={14} />
        <Animated.Text style={styles.text}>{config.label}</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.2,
  },
});
