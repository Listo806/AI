import { useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';

/**
 * Hook to handle API errors and show notifications for subscription errors
 */
export function useApiErrorHandler() {
  const { showError, showWarning } = useNotification();

  const handleError = useCallback((error, defaultMessage = 'An error occurred') => {
    // Check if it's a subscription error
    if (error.isSubscriptionError || error.status === 403) {
      // Show subscription error with warning style (yellow/orange)
      showWarning(error.message || defaultMessage, 8000); // Longer duration for subscription errors
      return true; // Indicates subscription error was handled
    }

    // Regular error
    showError(error.message || defaultMessage, 5000);
    return false;
  }, [showError, showWarning]);

  return { handleError };
}
