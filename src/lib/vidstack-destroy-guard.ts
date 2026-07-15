/**
 * Vidstack YouTube/Vimeo reject in-flight remote calls with "provider destroyed"
 * when torn down. Installed from SessionProvider / player mount (client-only).
 */
let installed = false;

function isProviderDestroyed(reason: unknown) {
  if (reason === "provider destroyed") return true;
  if (typeof reason === "string" && reason.includes("provider destroyed")) {
    return true;
  }
  if (reason instanceof Error && reason.message.includes("provider destroyed")) {
    return true;
  }
  return false;
}

export function installVidstackDestroyGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (!isProviderDestroyed(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
}
