/**
 * useGeolocationConsent — 152-ФЗ compliant geolocation wrapper.
 *
 * Stores consent in localStorage. If consent was not yet given,
 * calling requestPosition() sets `needsConsent = true` so the UI
 * can show a consent dialog. Once the user calls `grantConsent()`,
 * the actual browser geolocation request is made.
 */
import { useState, useCallback } from 'react';

const CONSENT_KEY = 'privod:geolocation-consent';

function hasStoredConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

function storeConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, 'granted');
  } catch {
    // ignore
  }
}

export interface GeolocationConsentState {
  /** Whether the consent dialog should be shown */
  needsConsent: boolean;
  /** Current position after successful acquisition */
  position: GeolocationPosition | null;
  /** Any error that occurred */
  error: GeolocationPositionError | null;
  /** Call when user approves geolocation — stores consent and requests position */
  grantConsent: () => void;
  /** Call when user declines */
  denyConsent: () => void;
  /** Initiates location request; shows consent dialog if not yet granted */
  requestPosition: () => void;
}

export function useGeolocationConsent(options?: PositionOptions): GeolocationConsentState {
  const [needsConsent, setNeedsConsent] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const doGetPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 2, message: 'Geolocation is not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition(pos),
      (err) => setError(err),
      options,
    );
  }, [options]);

  const requestPosition = useCallback(() => {
    if (hasStoredConsent()) {
      doGetPosition();
    } else {
      setNeedsConsent(true);
    }
  }, [doGetPosition]);

  const grantConsent = useCallback(() => {
    storeConsent();
    setNeedsConsent(false);
    doGetPosition();
  }, [doGetPosition]);

  const denyConsent = useCallback(() => {
    setNeedsConsent(false);
  }, []);

  return { needsConsent, position, error, grantConsent, denyConsent, requestPosition };
}
