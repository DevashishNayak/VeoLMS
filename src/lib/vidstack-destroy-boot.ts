/**
 * Install as early as possible (inline in root layout) so Next DevTools
 * never surfaces Vidstack's benign teardown rejections / TypeErrors.
 */
export const VIDSTACK_DESTROY_GUARD_BOOT = `(function(){
  if(window.__veolmsPdGuard) return;
  window.__veolmsPdGuard=1;
  function msg(r){
    if(typeof r==="string") return r;
    if(r && typeof r==="object" && typeof r.message==="string") return r.message;
    return null;
  }
  function isBenign(r){
    if(r==="provider destroyed") return true;
    var m=msg(r);
    if(!m) return false;
    if(m.indexOf("provider destroyed")!==-1) return true;
    if(m.indexOf("$state")!==-1 && m.indexOf("is not a function")!==-1) return true;
    return false;
  }
  window.addEventListener("unhandledrejection",function(e){
    if(!isBenign(e.reason)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);
  window.addEventListener("error",function(e){
    if(!isBenign(e.error!=null?e.error:e.message)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);
  var prevReject=window.onunhandledrejection;
  window.onunhandledrejection=function(e){
    if(isBenign(e.reason)){ e.preventDefault(); return true; }
    if(typeof prevReject==="function") return prevReject.call(this,e);
  };
  var prevError=window.onerror;
  window.onerror=function(message,source,lineno,colno,error){
    if(isBenign(error!=null?error:message)) return true;
    if(typeof prevError==="function") return prevError.call(this,message,source,lineno,colno,error);
    return false;
  };
})();`;

declare global {
  interface Window {
    __veolmsPdGuard?: number;
  }
}
