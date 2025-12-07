"use client";
import React, { useState } from 'react';

function resolveApiBase() {
    if (typeof window === 'undefined') return 'http://127.0.0.1:4000';
    return window.location.hostname === 'localhost' ? 'http://127.0.0.1:4000' : '';
}

export default function ImageUploader({
    value,
    onChange,
    label = "الصورة",
    hint = "يفضل 1200x630 بكسل"
}: {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    hint?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const apiBase = React.useMemo(() => resolveApiBase(), []);

    const authHeaders = React.useCallback(() => {
        if (typeof document === 'undefined') return {} as Record<string, string>;
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        let token = m ? m[1] : '';
        try { token = decodeURIComponent(token); } catch { }
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    async function handleFile(file: File) {
        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار صورة');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;

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
                    onChange(data.url);
                } else {
                    alert('فشل رفع الصورة');
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            alert('حدث خطأ أثناء رفع الصورة');
        } finally {
            setUploading(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    return (
        <div>
            <label className="block text-gray-400 mb-2">{label}</label>

            {value ? (
                <div className="space-y-3">
                    <div className="relative group">
                        <img
                            src={value}
                            alt={label}
                            className="w-full h-48 object-cover rounded-lg border border-[#1f2937]"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                            <button
                                onClick={() => onChange('')}
                                className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
                            >
                                🗑️ حذف الصورة
                            </button>
                        </div>
                    </div>

                    <label className="block cursor-pointer">
                        <div className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors">
                            📤 تغيير الصورة
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${dragActive ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-[#1f2937] hover:border-[#374151]'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                >
                    <label className="cursor-pointer block">
                        <div className="space-y-3">
                            <div className="text-5xl">📷</div>
                            <div className="text-gray-300 font-semibold">
                                {uploading ? 'جاري الرفع...' : 'اسحب الصورة هنا أو انقر للاختيار'}
                            </div>
                            <div className="text-sm text-gray-500">{hint}</div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
