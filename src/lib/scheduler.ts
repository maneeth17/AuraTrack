export function idleCallback(callback: () => void, timeout = 5000): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 0);
  }
}

export function idleCallbackWithFallback(
  idleWork: () => void,
  urgentWork: () => void,
  timeout = 5000
): void {
  if (typeof window === 'undefined') {
    urgentWork();
    return;
  }

  const deadline = Date.now() + timeout;

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      if (Date.now() < deadline) {
        idleWork();
      } else {
        urgentWork();
      }
    }, { timeout });
  } else {
    setTimeout(() => {
      if (Date.now() < deadline) {
        idleWork();
      } else {
        urgentWork();
      }
    }, 0);
  }
}
