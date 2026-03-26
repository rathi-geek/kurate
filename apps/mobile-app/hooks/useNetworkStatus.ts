import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export type NetworkConnectionType =
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'unknown';
export type NetworkSpeed = 'fast' | 'slow' | 'none';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: NetworkConnectionType;
  speed: NetworkSpeed;
  hasSlowConnection: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: false,
    connectionType: 'unknown',
    speed: 'none',
    hasSlowConnection: false,
  });

  const updateNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();

      // Map Expo network types to our simplified types
      let connectionType: NetworkConnectionType = 'unknown';
      let speed: NetworkSpeed = 'none';

      if (networkState.type === Network.NetworkStateType.WIFI) {
        connectionType = 'wifi';
        speed = 'fast';
      } else if (networkState.type === Network.NetworkStateType.CELLULAR) {
        connectionType = 'cellular';
        // Assume cellular connections might be slow (2G/3G)
        // In a real app, you could check the cellular generation
        speed = 'slow';
      } else if (networkState.type === Network.NetworkStateType.ETHERNET) {
        connectionType = 'ethernet';
        speed = 'fast';
      } else if (networkState.type === Network.NetworkStateType.NONE) {
        connectionType = 'none';
        speed = 'none';
      }

      const hasSlowConnection = speed === 'slow' && networkState.isConnected;

      setNetworkStatus({
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? false,
        connectionType,
        speed,
        hasSlowConnection: hasSlowConnection ?? false,
      });
    } catch (error) {
      console.warn('Failed to get network status:', error);
      // Fallback to unknown state
      setNetworkStatus({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'unknown',
        speed: 'none',
        hasSlowConnection: false,
      });
    }
  };

  useEffect(() => {
    // Get initial network status
    updateNetworkStatus();

    // Set up listener for network changes
    const subscription = Network.addNetworkStateListener(() => {
      updateNetworkStatus();
    });

    // Cleanup listener on unmount
    return () => {
      subscription?.remove();
    };
  }, []);

  return networkStatus;
}
