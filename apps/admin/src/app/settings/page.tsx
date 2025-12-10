"use client";
import React, { useState, useEffect } from 'react';
import { resolveApiBase } from "../lib/apiBase";
import { apiFetch } from "../lib/api";
import ImageUploader from '../components/ImageUploader';

export default function SettingsPage() {
  const [siteName, setSiteName] = useState('');
  const [siteLogo, setSiteLogo] = useState('');
  const [googleVerification, setGoogleVerification] = useState('');
  const [bingVerification, setBingVerification] = useState('');
  const [robotsTxt, setRobotsTxt] = useState('User-agent: *\nAllow: /');

  const [saving, setSaving] = useState(false);
  const [uploadingVer, setUploadingVer] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await apiFetch<any>('/api/admin/settings/list');
      const settings = data.settings || [];

      const getVal = (key: string) => settings.find((s: any) => s.key === key)?.value?.value || '';

      setSiteName(getVal('site_name'));
      setSiteLogo(getVal('site_logo'));
      setGoogleVerification(getVal('google_verification'));
      setBingVerification(getVal('bing_verification'));
      const r = getVal('robots_txt');
      if (r) setRobotsTxt(r);
    } catch (err) {
      console.error(err);
      // Quiet fail on load is better than alert loop
    }
  }

  async function handleVerificationUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.xml')) {
      alert('يرجى رفع ملف HTML أو XML فقط');
      return;
    }

    setUploadingVer(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = reader.result as string;
        const data = await apiFetch<any>('/api/admin/media/upload-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, filename: file.name })
        });

        if (data.ok) {
          alert(`تم رفع الملف بنجاح! الرابط: ${data.url}`);
        } else {
          alert('فشل الرفع');
        }
      } catch (err: any) {
        alert(err.message || 'خطأ في الرفع');
      } finally {
        setUploadingVer(false);
      }
    };
    reader.readAsText(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saveKey = async (key: string, val: string) => {
        return apiFetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: { value: val } })
        });
      };

      await Promise.all([
        saveKey('site_name', siteName),
        saveKey('site_logo', siteLogo),
        saveKey('google_verification', googleVerification),
        saveKey('bing_verification', bingVerification),
        saveKey('robots_txt', robotsTxt),
      ]);

      alert('تم الحفظ بنجاح! ✅');
    } catch (err: any) {
      alert('فشل الحفظ: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  }

  const sitemapUrl = `${resolveApiBase()}/sitemap.xml`;

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-white">الإعدادات العامة & SEO</h1>

      <div className="space-y-8">
        {/* الهوية العامة */}
        <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-8 space-y-6">
          <h2 className="text-xl font-bold text-blue-400 border-b border-[#1f2937] pb-4">1. هوية الموقع</h2>

          <div>
            <label className="block text-lg font-semibold text-gray-300 mb-3">اسم الموقع</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full bg-[#0b0e14] border border-[#1f2937] rounded-lg p-4 text-white text-lg focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل اسم موقعك"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-300 mb-3">شعار الموقع</label>
            <ImageUploader
              value={siteLogo}
              onChange={setSiteLogo}
              label=""
              hint="يفضل استخدام صورة PNG بخلفية شفافة (200x50 بكسل)"
            />
          </div>
        </div>

        {/* التحقق من الملكية */}
        <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-8 space-y-6">
          <h2 className="text-xl font-bold text-green-400 border-b border-[#1f2937] pb-4">2. التحقق من محركات البحث</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 mb-2">Google Verification Code (Meta Tag)</label>
              <input
                type="text"
                value={googleVerification}
                onChange={(e) => setGoogleVerification(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-3 text-white font-mono text-sm"
                placeholder='google-site-verification=...'
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">أو رفع ملف التحقق (HTML File)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1f2937] rounded-lg cursor-pointer hover:bg-[#1f2937] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-gray-400">
                    {uploadingVer ? 'جاري الرفع...' : 'اضغط لرفع ملف HTML'}
                  </p>
                  <p className="text-xs text-gray-500">google......html</p>
                </div>
                <input type="file" className="hidden" onChange={handleVerificationUpload} accept=".html,.xml" disabled={uploadingVer} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Bing Webmaster Verification Code</label>
            <input
              type="text"
              value={bingVerification}
              onChange={(e) => setBingVerification(e.target.value)}
              className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-3 text-white font-mono text-sm"
              placeholder='<meta name="msvalidate.01" content="..." />'
              dir="ltr"
            />
          </div>
        </div>

        {/* خريطة الموقع & Robots */}
        <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-8 space-y-6">
          <h2 className="text-xl font-bold text-yellow-400 border-b border-[#1f2937] pb-4">3. ملفات الزحف (Crawling)</h2>

          <div className="flex items-center justify-between bg-[#0b0e14] p-4 rounded border border-[#1f2937]">
            <div>
              <h3 className="font-bold text-white">خريطة الموقع (Sitemap.xml)</h3>
              <p className="text-sm text-gray-500">يتم توليدها تلقائياً بناءً على الصفحات</p>
            </div>
            <div className="flex gap-3">
              <a
                href={sitemapUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                👁️ معاينة
              </a>
              <a
                href={sitemapUrl}
                download="sitemap.xml"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                ⬇️ تحميل الملف
              </a>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">محتوى ملف Robots.txt</label>
            <textarea
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-4 text-white font-mono text-sm h-48"
              dir="ltr"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-lg shadow-lg transition-colors"
          >
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ كافة الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
}
