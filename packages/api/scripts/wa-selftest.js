/*
  WhatsApp template self-test
  Usage: node scripts/wa-selftest.js "+967777310606"
  - Reads latest Integration(provider='whatsapp')
  - Sends a test OTP message using robust permutations (languages, components, buttons)
  - Prints a concise report and exits 0 (non-blocking)
*/

/* eslint-disable no-console */
async function main() {
  const target = process.argv[2] || '+967777310606';
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const integ = await prisma.integration.findFirst({
      where: { provider: 'whatsapp' },
      orderBy: { createdAt: 'desc' },
    });
    if (!integ) {
      console.error('[wa-selftest] No whatsapp integration found');
      return;
    }
    const cfg = (integ && integ.config) ? integ.config : {};
    const token = cfg.token;
    const phoneId = cfg.phoneId;
    const template = cfg.template || 'verify_code';
    let languageCode = cfg.languageCode || 'ar';
    const headerType = cfg.headerType;
    const headerParam = cfg.headerParam;
    const buttonSubType = cfg.buttonSubType; // may be undefined; we will also auto-try
    const buttonIndex = Number(cfg.buttonIndex || 0);
    const buttonParam = cfg.buttonParam; // may be undefined; we will auto-fill with OTP

    if (!token || !phoneId) {
      console.error('[wa-selftest] whatsapp integration missing token/phoneId');
      return;
    }
    if (String(languageCode).toLowerCase() === 'arabic') languageCode = 'ar';

    const url = `https://graph.facebook.com/v17.0/${encodeURIComponent(String(phoneId))}/messages`;
    const e164 = String(target).startsWith('+') ? String(target) : `+${String(target)}`;
    const candidates = Array.from(new Set([String(languageCode), 'ar_SA', 'ar', 'en']));
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const digits = otp; // body param {{1}}

    const buildHeader = () => {
      if (!headerType || String(headerType).toLowerCase() === 'none') return null;
      const ht = String(headerType).toLowerCase();
      if (ht === 'text' && headerParam) return { type: 'header', parameters: [{ type: 'text', text: String(headerParam) }] };
      if ((ht === 'image' || ht === 'video' || ht === 'document') && headerParam) {
        const media = {}; media[ht] = { link: String(headerParam) };
        return { type: 'header', parameters: [{ type: ht, ...media }] };
      }
      return null;
    };

    const headerComp = buildHeader();
    const bodyComp = { type: 'body', parameters: [{ type: 'text', text: digits }] };
    const componentVariants = [];
    if (headerComp) componentVariants.push([headerComp, bodyComp]);
    componentVariants.push([bodyComp]);
    if (headerComp) componentVariants.push([headerComp]);
    componentVariants.push([]);

    const buttonVariants = [];
    // Integration-provided button first (if any)
    if (buttonSubType && (buttonSubType === 'url' || buttonSubType === 'quick_reply' || buttonSubType === 'phone_number')) {
      const bp = (typeof buttonParam === 'string' && buttonParam.trim()) ? String(buttonParam) : digits;
      buttonVariants.push({ sub_type: buttonSubType, index: String(buttonIndex || 0), param: bp });
    }
    // Auto trials
    buttonVariants.push({ sub_type: 'url', index: '0', param: digits });
    buttonVariants.push({ sub_type: 'quick_reply', index: '0', param: digits });
    buttonVariants.push(null); // no button

    const tried = [];
    for (const lang of candidates) {
      for (const comps of componentVariants) {
        for (const btn of buttonVariants) {
          const payload = { messaging_product: 'whatsapp', to: e164, type: 'template', template: { name: String(template), language: { code: String(lang), policy: 'deterministic' }, components: comps.slice() } };
          if (btn) payload.template.components.push({ type: 'button', sub_type: btn.sub_type, index: btn.index, parameters: [{ type: 'text', text: btn.param }] });
          const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const text = await res.text().catch(() => '');
          tried.push({ lang, comps: payload.template.components.map(c => c.type), status: res.status, body: text.slice(0, 400) });
          if (res.ok) {
            console.log('[wa-selftest] OK', { lang, button: btn ? btn.sub_type : 'none' });
            console.log('[wa-selftest] tried:', tried);
            return;
          }
        }
      }
    }
    console.error('[wa-selftest] FAILED');
    console.error('[wa-selftest] tried:', tried);
  } catch (e) {
    console.error('[wa-selftest] ERROR', e && e.message ? e.message : String(e));
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }
}

main();

