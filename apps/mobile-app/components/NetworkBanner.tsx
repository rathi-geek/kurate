import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { WifiOff, Wifi, WifiLow } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkBanner() {
  const networkStatus = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const previousConnectionRef = useRef(networkStatus.isConnected);

  const shouldShowBanner =
    !networkStatus.isConnected ||
    (networkStatus.isConnected && !networkStatus.isInternetReachable) ||
    networkStatus.hasSlowConnection;

  // Determine banner content based on network status
  const getBannerContent = () => {
    if (!networkStatus.isConnected) {
      return {
        type: 'error' as const,
        icon: WifiOff,
        message: 'No internet connection',
      };
    }

    if (networkStatus.isConnected && !networkStatus.isInternetReachable) {
      return {
        type: 'warning' as const,
        icon: WifiOff,
        message: 'Connected but no internet access',
      };
    }

    if (networkStatus.hasSlowConnection) {
      return {
        type: 'warning' as const,
        icon: WifiLow,
        message: 'Slow connection detected',
      };
    }

    // Connection restored
    return {
      type: 'success' as const,
      icon: Wifi,
      message: 'Connection restored',
    };
  };

  const bannerContent = getBannerContent();

  useEffect(() => {
    const wasDisconnected = !previousConnectionRef.current;
    const isNowConnected =
      networkStatus.isConnected && networkStatus.isInternetReachable;

    if (shouldShowBanner) {
      // Show banner
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Hide banner, but show "Connection restored" briefly if reconnected
      if (wasDisconnected && isNowConnected) {
        // Show "Connection restored" message briefly
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Auto-hide after 2 seconds
          setTimeout(() => {
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 2000);
        });
      } else {
        // Hide immediately
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }

    // Update previous connection state
    previousConnectionRef.current = networkStatus.isConnected;
  }, [
    shouldShowBanner,
    networkStatus.isConnected,
    networkStatus.isInternetReachable,
    slideAnim,
  ]);

  const IconComponent = bannerContent.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <Alert action={bannerContent.type} variant="solid">
        <AlertIcon>
          <Icon as={IconComponent} size="md" />
        </AlertIcon>
        <AlertText>{bannerContent.message}</AlertText>
      </Alert>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
