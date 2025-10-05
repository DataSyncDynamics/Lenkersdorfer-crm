/**
 * Haptic feedback utilities for mobile UX
 * Provides subtle vibration feedback for key user actions
 */

/**
 * Triggers a subtle haptic feedback vibration (10ms)
 * Safe to call - silently fails if vibration API is not supported
 */
export const triggerHapticFeedback = (): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10) // 10ms subtle vibration
    } catch (error) {
      // Silently fail if vibration is not supported or permission is denied
      console.debug('Haptic feedback not available:', error)
    }
  }
}

/**
 * Check if haptic feedback is supported on this device
 */
export const isHapticFeedbackSupported = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator
}
