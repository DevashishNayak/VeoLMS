/**
 * Vidstack YouTube/Vimeo reject in-flight remote calls with "provider destroyed"
 * when torn down, and can throw TypeError `$state[prop] is not a function`
 * after destroy / soft src swaps. Install as early as possible on the client.
 */
let installed = false;

function messageFrom(reason: unknown): string | null {
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === "object") {
    const msg = (reason as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return null;
}

export function isProviderDestroyed(reason: unknown) {
  if (reason === "provider destroyed") return true;
  const msg = messageFrom(reason);
  return Boolean(msg && msg.includes("provider destroyed"));
}

/** Known Vidstack Runtime TypeError after player/$state teardown. */
export function isVidstackStateTornDown(reason: unknown) {
  const msg = messageFrom(reason);
  if (!msg) return false;
  return msg.includes("$state") && msg.includes("is not a function");
}

export function isBenignVidstackTeardown(reason: unknown) {
  return isProviderDestroyed(reason) || isVidstackStateTornDown(reason);
}

export function installVidstackDestroyGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const onReject = (event: PromiseRejectionEvent) => {
    if (!isBenignVidstackTeardown(event.reason)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const onError = (event: ErrorEvent) => {
    if (!isBenignVidstackTeardown(event.error ?? event.message)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  window.addEventListener("unhandledrejection", onReject, true);
  window.addEventListener("error", onError, true);

  const prevReject = window.onunhandledrejection;
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    if (isBenignVidstackTeardown(event.reason)) {
      event.preventDefault();
      return true;
    }
    if (typeof prevReject === "function") {
      return (prevReject as (ev: PromiseRejectionEvent) => unknown).call(
        window,
        event
      );
    }
  };

  const prevError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (isBenignVidstackTeardown(error ?? message)) {
      return true;
    }
    if (typeof prevError === "function") {
      return prevError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // Swallow console.error noise Next DevTools sometimes stitches from.
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (args.some((a) => isBenignVidstackTeardown(a))) return;
    origError.apply(console, args);
  };
}

if (typeof window !== "undefined") {
  installVidstackDestroyGuard();
}
