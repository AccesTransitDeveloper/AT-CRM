import { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole } from '../types';

export type TrackingStatus = 
  | 'idle'
  | 'consent_required'
  | 'tracking_active'
  | 'browser_denied'
  | 'consent_declined'
  | 'unavailable'
  | 'error';

interface UseEmployeeLocationTrackerProps {
  employeeId?: string;
  employeeName?: string;
  employeeRole?: UserRole;
  enabled?: boolean;
}

export function useEmployeeLocationTracker({
  employeeId = 'emp-1',
  employeeName = 'Elena Rostova',
  employeeRole = 'admin',
  enabled = true
}: UseEmployeeLocationTrackerProps) {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('idle');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Send single heartbeat to backend
  const sendLocationHeartbeat = useCallback(async (lat: number, lng: number, accuracy?: number, heading?: number | null, speed?: number | null) => {
    try {
      const res = await fetch('/api/employees/location/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          lat,
          lng,
          accuracy: accuracy || 10,
          heading: heading ?? null,
          speed: speed ?? null,
          deviceInfo: navigator.userAgent.includes('Mac') ? 'macOS Workstation' : 
                      navigator.userAgent.includes('Windows') ? 'Windows Workstation' : 'Mobile / Field Device'
        })
      });

      if (res.ok) {
        setLastCoords({ lat, lng, accuracy });
        setLastHeartbeatTime(new Date().toLocaleTimeString());
        setTrackingStatus('tracking_active');
      }
    } catch (err: any) {
      console.warn('Location heartbeat transmission failed:', err);
    }
  }, [employeeId]);

  // Request browser geolocation
  const triggerBrowserGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setTrackingStatus('unavailable');
      setErrorMessage('Geolocation API not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        sendLocationHeartbeat(latitude, longitude, accuracy, heading, speed);

        // Clear existing interval if any
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        // Periodic background heartbeat every 90 seconds
        heartbeatIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              sendLocationHeartbeat(
                pos.coords.latitude, 
                pos.coords.longitude, 
                pos.coords.accuracy, 
                pos.coords.heading, 
                pos.coords.speed
              );
            },
            (err) => {
              console.warn('Periodic geolocation sample failed:', err.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        }, 90000);
      },
      (error) => {
        console.warn('Browser geolocation permission denied or unavailable:', error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setTrackingStatus('browser_denied');
          setErrorMessage('Доступ к геолокации отклонён в браузере. CRM работает нормально, статус: Location Unavailable.');
        } else {
          setTrackingStatus('unavailable');
          setErrorMessage('Не удалось получить координаты GPS.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [sendLocationHeartbeat]);

  // Check initial consent status
  useEffect(() => {
    if (!enabled || !employeeId) return;

    const checkConsent = async () => {
      try {
        const res = await fetch(`/api/employees/location/consent/${employeeId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.consented === true) {
            // Already consented previously -> trigger browser geolocation
            triggerBrowserGeolocation();
          } else if (data.revokedAt) {
            // Explicitly revoked
            setTrackingStatus('consent_declined');
          } else {
            // First time or unrecorded -> Show Consent Modal
            setIsConsentModalOpen(true);
            setTrackingStatus('consent_required');
          }
        } else {
          setIsConsentModalOpen(true);
          setTrackingStatus('consent_required');
        }
      } catch (err) {
        console.error('Failed to query location consent:', err);
        // Fallback: check localStorage
        const stored = localStorage.getItem(`at_geo_consent_${employeeId}`);
        if (stored === 'granted') {
          triggerBrowserGeolocation();
        } else if (stored === 'declined') {
          setTrackingStatus('consent_declined');
        } else {
          setIsConsentModalOpen(true);
          setTrackingStatus('consent_required');
        }
      }
    };

    checkConsent();

    // Clean up on component unmount
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [employeeId, enabled, triggerBrowserGeolocation]);

  // Tab Close / Window Unload cleanup (beforeunload & pagehide)
  useEffect(() => {
    const handleUnload = () => {
      if (employeeId) {
        const payload = JSON.stringify({ employeeId });
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/employees/location/clear', blob);
        } else {
          fetch('/api/employees/location/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [employeeId]);

  // Modal actions
  const handleGrantConsent = useCallback(() => {
    localStorage.setItem(`at_geo_consent_${employeeId}`, 'granted');
    setIsConsentModalOpen(false);
    triggerBrowserGeolocation();
  }, [employeeId, triggerBrowserGeolocation]);

  const handleDeclineConsent = useCallback(() => {
    localStorage.setItem(`at_geo_consent_${employeeId}`, 'declined');
    setIsConsentModalOpen(false);
    setTrackingStatus('consent_declined');
  }, [employeeId]);

  const handleRevokeConsent = useCallback(async () => {
    try {
      await fetch('/api/employees/location/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, consented: false })
      });
      await fetch('/api/employees/location/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      localStorage.setItem(`at_geo_consent_${employeeId}`, 'declined');
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      setTrackingStatus('consent_declined');
      setLastCoords(null);
    } catch (err) {
      console.error('Failed to revoke consent:', err);
    }
  }, [employeeId]);

  return {
    trackingStatus,
    isConsentModalOpen,
    setIsConsentModalOpen,
    lastCoords,
    lastHeartbeatTime,
    errorMessage,
    handleGrantConsent,
    handleDeclineConsent,
    handleRevokeConsent,
    triggerBrowserGeolocation
  };
}
