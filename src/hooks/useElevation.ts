import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/ipc';
import { useAppStore } from '../stores/useAppStore';

export interface ElevationHookState {
  isElevated: boolean;
  helperConnected: boolean;
  isLoading: boolean;
  requestElevation: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function useElevation(): ElevationHookState {
  const [isElevated, setIsElevated] = useState(false);
  const [helperConnected, setHelperConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setElevationState, pushToast } = useAppStore();

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.checkElevationStatus();
      if (res.success && res.data) {
        setIsElevated(res.data.isElevated);
        setHelperConnected(res.data.helperConnected);
        setElevationState(res.data.isElevated);
      }
    } catch (e) {
      console.warn('Failed to check elevation status:', e);
    }
  }, [setElevationState]);

  const requestElevation = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.requestElevation();
      if (res.success && res.data) {
        setIsElevated(res.data.isElevated);
        setHelperConnected(res.data.helperConnected);
        setElevationState(res.data.isElevated);
        pushToast({
          type: 'success',
          title: 'Elevation Granted',
          message: 'Privileged helper daemon iptracer-helper is active with Administrator privileges.',
        });
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      pushToast({
        type: 'error',
        title: 'Elevation Request Failed',
        message: 'Could not connect to elevated helper daemon. Operating in graceful unprivileged mode.',
      });
    }
    setIsLoading(false);
    return false;
  }, [setElevationState, pushToast]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    isElevated,
    helperConnected,
    isLoading,
    requestElevation,
    refreshStatus,
  };
}
