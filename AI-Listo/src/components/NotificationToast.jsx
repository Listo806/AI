import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import './NotificationToast.css';

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onClose }) {
  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`notification-toast notification-${notification.type}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-message">{notification.message}</div>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}
