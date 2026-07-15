/**
 * Runs before Next.js / React hydrate. Swallows Vidstack's known
 * "provider destroyed" unhandledrejection so the dev overlay never opens.
 */
(function () {
  function isDestroyed(reason) {
    if (reason === "provider destroyed") return true;
    if (typeof reason === "string" && reason.indexOf("provider destroyed") !== -1) {
      return true;
    }
    if (
      reason &&
      typeof reason === "object" &&
      typeof reason.message === "string" &&
      reason.message.indexOf("provider destroyed") !== -1
    ) {
      return true;
    }
    return false;
  }

  function onReject(event) {
    if (!isDestroyed(event.reason)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  window.addEventListener("unhandledrejection", onReject, true);

  var previous = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    if (isDestroyed(event.reason)) {
      event.preventDefault();
      return true;
    }
    if (typeof previous === "function") {
      return previous.call(this, event);
    }
  };
})();
