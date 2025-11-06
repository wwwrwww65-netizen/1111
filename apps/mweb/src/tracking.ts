export async function injectTracking(): Promise<void> {
  try {
    // Sentry init if DSN provided
    let sentryDsn = (import.meta as any)?.env?.SENTRY_DSN;
    if (!sentryDsn){
      try{ const r = await fetch('/api/tracking/keys', { credentials:'omit' }); if(r.ok){ const j = await r.json(); sentryDsn = j?.keys?.SENTRY_DSN || sentryDsn } }catch{}
    }
    if (sentryDsn && !document.getElementById('sentry')){
      const s = document.createElement('script'); s.id='sentry'; s.src='https://browser.sentry-cdn.com/7.119.0/bundle.tracing.min.js'; s.integrity='sha384-'; s.crossOrigin='anonymous'; s.onload = ()=>{
        // @ts-ignore
        Sentry.init({ dsn: sentryDsn, tracesSampleRate: 0.1 });
      };
      document.head.appendChild(s);
    }

    // Web Vitals to GA4 if consented
    // Lazy import to avoid blocking
    import('https://unpkg.com/web-vitals@3/dist/web-vitals.attribution.iife.js').then(()=>{
      // @ts-ignore
      if (typeof webVitals!=='undefined' && (window as any).gtag){
        // @ts-ignore
        webVitals.onCLS(sendToGA); webVitals.onFID(sendToGA); webVitals.onLCP(sendToGA); webVitals.onINP(sendToGA); webVitals.onTTFB(sendToGA);
        function sendToGA(metric:any){
          // @ts-ignore
          gtag('event', metric.name, { value: Math.round(metric.value * (metric.name==='CLS'?1000:1)), event_label: metric.id, non_interaction: true });
        }
      }
    }).catch(()=>{})
    // Wait for consent
    const consent = localStorage.getItem('consent_v1')
    if (consent !== 'yes') {
      document.addEventListener('consent:granted', ()=> injectTracking(), { once: true })
      return
    }
    let fb = (import.meta as any)?.env?.FB_PIXEL_ID;
    let ga = (import.meta as any)?.env?.GA_MEASUREMENT_ID;
    let gtm = (import.meta as any)?.env?.GOOGLE_TAG_MANAGER_ID;
    let tiktok = (import.meta as any)?.env?.TIKTOK_PIXEL_ID;
    try {
      const resp = await fetch('/api/tracking/keys', { credentials: 'omit' });
      if (resp.ok) {
        const j = await resp.json();
        const keys = j?.keys || {};
        fb = fb || keys.FB_PIXEL_ID;
        ga = ga || keys.GA_MEASUREMENT_ID;
        gtm = gtm || keys.GOOGLE_TAG_MANAGER_ID;
        tiktok = tiktok || keys.TIKTOK_PIXEL_ID;
      }
    } catch {}
    if (fb && !document.getElementById('fb-pixel')){
      const s = document.createElement('script'); s.id='fb-pixel'; s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init','${fb}'); fbq('track','PageView');`;
      document.head.appendChild(s);
    }
    // Also send PageView via CAPI for dedupe-ready tracking
    try{ const { trackEvent } = await import('./lib/track'); trackEvent('PageView', { currency: (window as any).__CURRENCY_CODE__||'YER' }) }catch{}
    if (ga && !document.getElementById('ga-gtag')){
      const s1 = document.createElement('script'); s1.async=true; s1.src=`https://www.googletagmanager.com/gtag/js?id=${ga}`; document.head.appendChild(s1);
      const s2 = document.createElement('script'); s2.id='ga-gtag'; s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config','${ga}', { 'transport_type': 'beacon' });`;
      document.head.appendChild(s2);
    }
    if (gtm && !document.getElementById('gtm')){
      const s = document.createElement('script'); s.id='gtm'; s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`;
      document.head.appendChild(s);
    }
    if (tiktok && !document.getElementById('tt-pixel')){
      const s = document.createElement('script'); s.id='tt-pixel'; s.innerHTML = `!function (w, d, t) { w.TiktokAnalyticsObject=t; var ttq=w[t]=w[t]||[]; ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie']; ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; for(var i=0;i<ttq.methods.length;i++){ttq.setAndDefer(ttq,ttq.methods[i])} ttq.instance=function(t){var e=ttq._i[t]||[]; for(var n=0;n<ttq.methods.length;n++){ttq.setAndDefer(e,ttq.methods[n])} return e}; ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i=ttq._i||{}; ttq._i[e]=[]; ttq._i[e]._u=i; ttq._t=ttq._t||{}; ttq._t[e]=+new Date; ttq._o=ttq._o||{}; ttq._o[e]=n||{}; var o=document.createElement('script'); o.type='text/javascript'; o.async=true; o.src=i; var a=document.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o,a) }; ttq.load('${tiktok}'); ttq.page(); }(window, document, 'ttq');`;
      document.head.appendChild(s);
    }
  } catch {}
}

