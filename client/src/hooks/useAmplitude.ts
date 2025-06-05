import { useCallback } from 'react';

declare global {
  interface Window {
    amplitude: any;
  }
}

export const useAmplitude = () => {
  const logEvent = useCallback((eventName: string, eventProperties?: object) => {
    if (typeof window !== 'undefined' && window.amplitude) {
      window.amplitude.getInstance().logEvent(eventName, eventProperties);
    }
  }, []);

  const setUserId = useCallback((userId: string) => {
    if (typeof window !== 'undefined' && window.amplitude) {
      window.amplitude.getInstance().setUserId(userId);
    }
  }, []);

  const setUserProperties = useCallback((userProperties: object) => {
    if (typeof window !== 'undefined' && window.amplitude) {
      window.amplitude.getInstance().setUserProperties(userProperties);
    }
  }, []);

  return { logEvent, setUserId, setUserProperties };
};
