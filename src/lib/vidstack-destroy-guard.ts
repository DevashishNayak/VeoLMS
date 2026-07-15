/**
 * Vidstack YouTube/Vimeo reject in-flight remote calls with "provider destroyed"
 * when torn down. Install as early as possible on the client.
 */
let installed = false;

export function isProviderDestroyed(reason: unknown) {
  if (reason === "provider destroyed") return true;
  if (typeof reason === "string" && reason.includes("provider destroyed")) {
    return true;
  }
  if (reason instanceof Error && reason.message.includes("provider destroyed")) {
    return true;
  }
  if (reason && typeof reason === "object") {
    const msg = (reason as { message?: unknown }).message;
    if (typeof msg === "string" && msg.includes("provider destroyed")) {
      return true;
    }
  }
  return false;
}

export function installVidstackDestroyGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const onReject = (event: PromiseRejectionEvent) => {
    if (!isProviderDestroyed(event.reason)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  window.addEventListener("unhandledrejection", onReject, true);

  const prev = window.onunhandledrejection;
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    if (isProviderDestroyed(event.reason)) {
      event.preventDefault();
      return true;
    }
    if (typeof prev === "function") {
      return (prev as (ev: PromiseRejectionEvent) => unknown).call(
        window,
        event
      );
    }
  };

  // Swallow console.error noise Next DevTools sometimes stitches from.
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (args.some((a) => isProviderDestroyed(a))) return;
    origError.apply(console, args);
  };
}

if (typeof window !== "undefined") {
  installVidstackDestroyGuard();
}
