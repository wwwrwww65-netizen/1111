"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeoListPage() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    function getAuthHeaders() {
        if (typeof document === 'undefined') return {} as Record<string, string>;
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        let token = m ? m[1] : '';
        try { token = decodeURIComponent(token); } catch { }
        return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
    }

    useEffect(() => {
        fetch('/api/admin/seo/pages', {
            credentials: 'include',
            headers: { ...getAuthHeaders() }
        })
            .then(res => res.json())
            .then(data => {
                if (data.ok) setPages(data.pages);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-6 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">SEO – محركات البحث</h1>
                <button
                    onClick={() => router.push('/seo/engine/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+ صفحة جديدة</span>
                </button>
            </div>

            <div className="bg-[#111827] rounded-lg border border-[#1f2937] overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-[#1f2937] text-gray-300">
                        <tr>
                            <th className="p-4">العنوان (SEO Title)</th>
                            <th className="p-4">الرابط (Slug)</th>
                            <th className="p-4">الكلمة المفتاحية</th>
                            <th className="p-4">آخر تحديث</th>
                            <th className="p-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2937] text-gray-300">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">جاري التحميل...</td></tr>
                        ) : pages.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-500">لا توجد صفحات مضافة بعد</td></tr>
                        ) : (
                            pages.map((page) => (
                                <tr key={page.id} className="hover:bg-[#1f2937]/50">
                                    <td className="p-4 font-medium">{page.titleSeo || '-'}</td>
                                    <td className="p-4 text-blue-400" dir="ltr">{page.slug}</td>
                                    <td className="p-4">
                                        {page.focusKeyword ? (
                                            <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm">
                                                {page.focusKeyword}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-sm text-gray-400">
                                        {new Date(page.lastUpdated).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => router.push(`/seo/engine/${page.id}`)}
                                            className="text-blue-400 hover:text-blue-300 ml-3"
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('هل أنت متأكد من الحذف؟')) return;
                                                await fetch(`/api/admin/seo/pages/${page.id}`, {
                                                    method: 'DELETE',
                                                    credentials: 'include',
                                                    headers: { ...getAuthHeaders() }
                                                });
                                                setPages(pages.filter(p => p.id !== page.id));
                                            }}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            حذف
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
