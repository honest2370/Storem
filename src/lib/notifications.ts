// Push Notifications and Sound Management

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'message';

const NOTIFICATION_SOUNDS: Record<NotificationType, string> = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  warning: '/sounds/warning.mp3',
  info: '/sounds/info.mp3',
  message: '/sounds/message.mp3'
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const playNotificationSound = (type: NotificationType = 'info'): void => {
  try {
    const audio = new Audio(NOTIFICATION_SOUNDS[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silently fail if audio cannot be played
    });
  } catch {
    // Handle audio errors silently
  }
};

export const showNotification = (
  title: string,
  body: string,
  options?: {
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
    type?: NotificationType;
    playSound?: boolean;
  }
): Notification | null => {
  if (Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    body,
    icon: options?.icon || '/icons/icon-192x192.png',
    badge: options?.badge || '/icons/icon-72x72.png',
    tag: options?.tag,
    data: options?.data
  });

  if (options?.playSound !== false) {
    playNotificationSound(options?.type || 'info');
  }

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
};

export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });
    return subscription;
  } catch {
    console.warn('Push notification subscription failed');
    return null;
  }
};

export const sendPushNotification = async (userId: string, title: string, body: string): Promise<void> => {
  // This would typically call your backend which then calls the push service
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body })
    });
  } catch {
    console.warn('Failed to send push notification');
  }
};
