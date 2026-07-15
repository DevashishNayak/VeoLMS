/**
 * Install as early as possible (inline in root layout) so Next DevTools
 * never surfaces Vidstack's benign "provider destroyed" rejection.
 */
export const VIDSTACK_DESTROY_GUARD_BOOT = `(function(){
  if(window.__veolmsPdGuard) return;
  window.__veolmsPdGuard=1;
  function isPD(r){
    if(r==="provider destroyed") return true;
    if(typeof r==="string" && r.indexOf("provider destroyed")!==-1) return true;
    if(r && typeof r==="object"){
      var m=r.message;
      if(typeof m==="string" && m.indexOf("provider destroyed")!==-1) return true;
    }
    return false;
  }
  window.addEventListener("unhandledrejection",function(e){
    if(!isPD(e.reason)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);
  var prev=window.onunhandledrejection;
  window.onunhandledrejection=function(e){
    if(isPD(e.reason)){ e.preventDefault(); return true; }
    if(typeof prev==="function") return prev.call(this,e);
  };
})();`;

declare global {
  interface Window {
    __veolmsPdGuard?: number;
  }
}
