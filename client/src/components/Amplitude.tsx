import { useEffect } from 'react';

interface AmplitudeProps {
  apiKey: string;
}

declare global {
  interface Window {
    amplitude: any;
  }
}

export default function Amplitude({ apiKey }: AmplitudeProps) {
  useEffect(() => {
    if (!apiKey) return;

    // Load Amplitude script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
      ;r.type="text/javascript"
      ;r.integrity="sha384-NPoj2nKGhHpKCnrSBAYKbkdpgCEJpynyJ9KFKrZpW4JCBZ9Zm5yG8S8E3ULp7Q0g"
      ;r.crossOrigin="anonymous";r.async=true
      ;r.src="https://cdn.amplitude.com/libs/amplitude-8.21.9-min.gz.js"
      ;r.onload=function(){if(!e.amplitude.runQueuedFunctions){
      console.log("[Amplitude] Error: could not load SDK")}}
      ;var s=t.getElementsByTagName("script")[0];s.parentNode.insertBefore(r,s)
      ;function i(e,t){e.prototype[t]=function(){
      this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
      var o=function(){this._q=[];return this}
      ;var a=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove"]
      ;for(var c=0;c<a.length;c++){i(o,a[c])}n.Identify=o;var u=function(){this._q=[]
      ;return this}
      ;var l=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
      ;for(var p=0;p<l.length;p++){i(u,l[p])}n.Revenue=u
      ;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId"]
      ;function v(e){function t(t){e[t]=function(){
      e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}
      for(var n=0;n<d.length;n++){t(d[n])}}v(n);n.getInstance=function(e){
      e=(!e||e.length===0?"$default_instance":e).toLowerCase()
      ;if(!Object.prototype.hasOwnProperty.call(n._iq,e)){
      n._iq[e]={_q:[]};v(n._iq[e])}return n._iq[e]};e.amplitude=n})(window,document);

      amplitude.getInstance().init("${apiKey}");
    `;

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  return null;
}
