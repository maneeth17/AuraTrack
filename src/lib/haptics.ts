const hapticCooldowns = new Map<string, number>();

export function hapticVibrate(pattern: number[], id = 'default') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  const now = Date.now();
  const last = hapticCooldowns.get(id) || 0;

  if (now - last < 200) return;

  hapticCooldowns.set(id, now);
  navigator.vibrate(pattern);
}
