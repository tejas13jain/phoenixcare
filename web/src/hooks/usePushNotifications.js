import { useCallback, useEffect, useState } from 'react';
import { pushApi } from '../api/pushApi.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const isPushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window;

export function usePushNotifications() {
  const [permission, setPermission] = useState(isPushSupported() ? Notification.permission : 'unsupported');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (isPushSupported()) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return { ok: false, reason: 'denied' };

      const registration = await navigator.serviceWorker.ready;
      const { data } = await pushApi.getPublicKey();
      if (!data.publicKey) return { ok: false, reason: 'not_configured' };

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
      }

      await pushApi.subscribe(subscription.toJSON());
      return { ok: true };
    } finally {
      setSubscribing(false);
    }
  }, []);

  return { permission, subscribing, subscribe, supported: isPushSupported() };
}
