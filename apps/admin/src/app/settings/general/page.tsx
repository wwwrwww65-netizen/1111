"use client";
import React, { useState, useEffect } from 'react';
import { resolveApiBase } from "../../lib/apiBase";

export default function GeneralSettingsPage() {
    const [siteName, setSiteName] = useState('');
    const [siteLogo, setSiteLogo] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const apiBase = React.useMemo(() => resolveApiBase(), []);

    const authHeaders = React.useCallback(() => {
        if (typeof document === 'undefined') return {} as Record<string, string>;
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        let token = m ? m[1] : '';
        try { token = decodeURIComponent(token); } catch { }
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const res = await fetch(`${apiBase}/api/admin/settings/list`, {
                credentials: 'include',
                headers: { ...authHeaders() }
            });
            const data = await res.json();
            const settings = data.settings || [];

            const nameRow = settings.find((s: any) => s.key === 'site_name');
            const logoRow = settings.find((s: any) => s.key === 'site_logo');

            if (nameRow?.value?.value) setSiteName(nameRow.value.value);
            if (logoRow?.value?.value) setSiteLogo(logoRow.value.value);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;

                // Upload to Cloudinary via API
                const res = await fetch(`${apiBase}/api/admin/media/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders()
                    },
                    credentials: 'include',
                    body: JSON.stringify({ dataUrl: base64 })
                });

                const data = await res.json();
                if (data.url) {
                    setSiteLogo(data.url);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            alert('فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            // Save site name
            await fetch(`${apiBase}/api/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders()
                },
                credentials: 'include',
                body: JSON.stringify({
                    key: 'site_name',
                    value: { value: siteName }
                })
            });

            // Save site logo
            await fetch(`${apiBase}/api/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders()
                },
                credentials: 'include',
                body: JSON.stringify({
                    key: 'site_logo',
                    value: { value: siteLogo }
                })
            });

            alert('تم الحفظ بنجاح! ✅');
        } catch (err) {
            alert('فشل الحفظ');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-3xl font-bold mb-8 text-white">الإعدادات العامة</h1>

            <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-8 space-y-8">

                {/* Site Name */}
                <div>
                    <label className="block text-lg font-semibold text-gray-300 mb-3">
                        اسم الموقع
                    </label>
                    <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded-lg p-4 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="أدخل اسم موقعك"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        سيظهر هذا الاسم في العنوان والشعار
                    </p>
                </div>

                {/* Site Logo */}
                <div>
                    <label className="block text-lg font-semibold text-gray-300 mb-3">
                        شعار الموقع
                    </label>

                    {siteLogo && (
                        <div className="mb-4 p-4 bg-[#0b0e14] rounded-lg border border-[#1f2937]">
                            <img
                                src={siteLogo}
                                alt="Site Logo"
                                className="h-24 object-contain"
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <label className="flex-1 cursor-pointer">
                            <div className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors">
                                {uploading ? 'جاري الرفع...' : '📤 رفع شعار جديد'}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>

                        {siteLogo && (
                            <button
                                onClick={() => setSiteLogo('')}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                🗑️ حذف
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                        يفضل استخدام صورة PNG بخلفية شفافة (200x50 بكسل)
                    </p>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-[#1f2937]">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
                    >
                        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
                    </button>
                </div>
            </div>

            {/* Preview Card */}
            <div className="mt-8 bg-[#111827] rounded-lg border border-[#1f2937] p-6">
                <h2 className="text-xl font-bold text-white mb-4">معاينة</h2>
                <div className="bg-[#0b0e14] rounded-lg p-6 flex items-center gap-4">
                    {siteLogo && (
                        <img src={siteLogo} alt="Logo" className="h-12 object-contain" />
                    )}
                    <span className="text-2xl font-bold text-white">
                        {siteName || 'اسم الموقع'}
                    </span>
                </div>
            </div>
        </div>
    );
}
