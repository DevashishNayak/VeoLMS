/** iPhone / iPad (incl. iPadOS desktop UA). Safe to call during SSR — returns false. */
export function isAppleTouchDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}
