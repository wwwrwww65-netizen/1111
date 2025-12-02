export async function injectTracking(): Promise<void> {
  try {
    // Ensure a global safe fbq stub exists to avoid ReferenceError anywhere
    try {
      const w = window as any
      if (!w.fbq) {
        const n: any = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
        n.queue = []; n.loaded = false; n.version = '2.0'; n.push = n; n.callMethod = null
        n.getState = function () { return { loaded: !!n.loaded, queueLength: (n.queue || []).length } }
        n.set = function () { /* no-op until script loads */ }
        w.fbq = n; w._fbq = n
      }
    } catch { }
    // Sentry init if DSN provided
    let sentryDsn = (import.meta as any)?.env?.SENTRY_DSN;
    if (!sentryDsn) {
      try { const r = await fetch('/api/tracking/keys', { credentials: 'omit' }); if (r.ok) { const j = await r.json(); sentryDsn = j?.keys?.SENTRY_DSN || sentryDsn } } catch { }
    }
    if (sentryDsn && !document.getElementById('sentry')) {
      const s = document.createElement('script'); s.id = 'sentry'; s.src = 'https://browser.sentry-cdn.com/7.119.0/bundle.tracing.min.js'; s.integrity = 'sha384-'; s.crossOrigin = 'anonymous'; s.onload = () => {
        // @ts-ignore
        Sentry.init({ dsn: sentryDsn, tracesSampleRate: 0.1 });
      };
      document.head.appendChild(s);
    }

    // NOTE: Run tracking without waiting for consent (temporary disable banner gating)
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
    } catch { }
    // Facebook Pixel: load async, init only after script loads, guard fbq usage
    if (fb && !document.getElementById('fb-pixel-loader')) {
      try {
        // fbq stub is ensured above; load script
        const scr = document.createElement('script');
        scr.id = 'fb-pixel-loader';
        scr.async = true;
        scr.src = 'https://connect.facebook.net/en_US/fbevents.js';
        scr.onload = () => {
          try {
            if ((window as any).fbq) {
              (window as any).fbq('init', fb);
              (window as any).fbq('track', 'PageView');
              try { (window as any).fbq.loaded = true } catch { }
            }
          } catch (err) { console.error('[FB Pixel] init error:', err); }
        };
        scr.onerror = (e) => { console.error('[FB Pixel] script load failed', e); };
        document.head.appendChild(scr);
      } catch (err) { console.error('[FB Pixel] setup error:', err); }
    }
    // Advanced Matching: set user em/ph hashed when available
    try {
      const subtle = (window.crypto && (window.crypto as any).subtle) as SubtleCrypto | undefined;
      const sha = async (s: string) => {
        try {
          if (!subtle) return '';
          const enc = new TextEncoder().encode(s);
          const buf = await subtle.digest('SHA-256', enc);
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch { return '' }
      };
      const me = await fetch('/api/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null);
      const emRaw = (me && me.user && me.user.email) ? String(me.user.email).trim().toLowerCase() : '';
      const phRaw = (me && me.user && me.user.phone) ? String(me.user.phone).replace(/\\D/g, '') : '';
      const em = emRaw ? await sha(emRaw) : '';
      const ph = phRaw ? await sha(phRaw) : '';
      if ((window as any).fbq && (em || ph)) {
        try {
          // Prefer advanced matching via init payload to avoid warnings
          if (typeof (window as any).fbq === 'function' && fb) {
            (window as any).fbq('init', fb, { ...(em ? { em } : {}), ...(ph ? { ph } : {}) })
              ; (window as any).fbq('track', 'PageView')
          }
        } catch (err) {
          try {
            // Fallback to set only when keys exist
            (window as any).fbq('set', 'user', { ...(em ? { em } : {}), ...(ph ? { ph } : {}) })
          } catch (e) { console.warn('[FB Pixel] advanced match failed', e) }
        }
      }
    } catch { }
    // Also send PageView via CAPI فقط (تجنّب بعث Pixel مرتين)
    try {
      const { trackEvent } = await import('./lib/track');
      trackEvent('PageView', { currency: (window as any).__CURRENCY_CODE__ || 'YER' });
    } catch { }
    if (ga && !document.getElementById('ga-gtag')) {
      const s1 = document.createElement('script'); s1.async = true; s1.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`; document.head.appendChild(s1);
      const s2 = document.createElement('script'); s2.id = 'ga-gtag'; s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config','${ga}', { 'transport_type': 'beacon' });`;
      document.head.appendChild(s2);
    }
    // Web Vitals (local ESM) to GA4 and CAPI (no external CDN)
    try {
      const { onCLS, onFID, onLCP, onINP, onTTFB } = await import('web-vitals/attribution');
      function toValue(n: string, v: number) { return Math.round(v * (n === 'CLS' ? 1000 : 1)) }
      async function sendAll(metric: any) {
        try {
          // Send to GA if present
          // @ts-ignore
          if ((window as any).gtag) {
            // @ts-ignore
            gtag('event', metric.name, { value: toValue(metric.name, metric.value), event_label: metric.id, non_interaction: true });
          }
        } catch { }
        try {
          const { trackEvent } = await import('./lib/track');
          await trackEvent('WebVital', { value: toValue(metric.name, metric.value), content_type: metric.name as any, contents: [{ id: metric.id }] });
        } catch { }
      }
      onCLS(sendAll); onFID(sendAll); onLCP(sendAll); onINP(sendAll); onTTFB(sendAll);
    } catch { }
    if (gtm && !document.getElementById('gtm')) {
      const s = document.createElement('script'); s.id = 'gtm'; s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`;
      document.head.appendChild(s);
    }
    if (tiktok && !document.getElementById('tt-pixel')) {
      const s = document.createElement('script'); s.id = 'tt-pixel'; s.innerHTML = `!function (w, d, t) { w.TiktokAnalyticsObject=t; var ttq=w[t]=w[t]||[]; ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie']; ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; for(var i=0;i<ttq.methods.length;i++){ttq.setAndDefer(ttq,ttq.methods[i])} ttq.instance=function(t){var e=ttq._i[t]||[]; for(var n=0;n<ttq.methods.length;n++){ttq.setAndDefer(e,ttq.methods[n])} return e}; ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i=ttq._i||{}; ttq._i[e]=[]; ttq._i[e]._u=i; ttq._t=ttq._t||{}; ttq._t[e]=+new Date; ttq._o=ttq._o||{}; ttq._o[e]=n||{}; var o=document.createElement('script'); o.type='text/javascript'; o.async=true; o.src=i; var a=document.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o,a) }; ttq.load('${tiktok}'); ttq.page(); }(window, document, 'ttq');`;
      document.head.appendChild(s);
    }
  } catch { }
}

