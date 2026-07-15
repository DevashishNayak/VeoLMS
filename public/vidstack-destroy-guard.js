/**
 * Runs before Next.js / React hydrate. Swallows Vidstack's known
 * teardown noise ("provider destroyed", $state TypeErrors) so the
 * dev overlay never opens.
 */
(function () {
  function messageFrom(reason) {
    if (typeof reason === "string") return reason;
    if (
      reason &&
      typeof reason === "object" &&
      typeof reason.message === "string"
    ) {
      return reason.message;
    }
    return null;
  }

  function isBenign(reason) {
    if (reason === "provider destroyed") return true;
    var msg = messageFrom(reason);
    if (!msg) return false;
    if (msg.indexOf("provider destroyed") !== -1) return true;
    if (
      msg.indexOf("$state") !== -1 &&
      msg.indexOf("is not a function") !== -1
    ) {
      return true;
    }
    return false;
  }

  function onReject(event) {
    if (!isBenign(event.reason)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function onError(event) {
    if (!isBenign(event.error != null ? event.error : event.message)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  window.addEventListener("unhandledrejection", onReject, true);
  window.addEventListener("error", onError, true);

  var previousReject = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    if (isBenign(event.reason)) {
      event.preventDefault();
      return true;
    }
    if (typeof previousReject === "function") {
      return previousReject.call(this, event);
    }
  };

  var previousError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isBenign(error != null ? error : message)) {
      return true;
    }
    if (typeof previousError === "function") {
      return previousError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
})();
