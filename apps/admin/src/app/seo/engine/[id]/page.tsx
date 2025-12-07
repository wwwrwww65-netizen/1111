"use client";
import React, { useEffect, useState } from 'react';
import SeoEditor from '../components/SeoEditor';

export default function EditSeoPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState(null);

    function getAuthHeaders() {
        if (typeof document === 'undefined') return {} as Record<string, string>;
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        let token = m ? m[1] : '';
        try { token = decodeURIComponent(token); } catch { }
        return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
    }

    useEffect(() => {
        fetch(`/api/admin/seo/pages/${params.id}`, { credentials: 'include', headers: { ...getAuthHeaders() } })
            .then(res => res.json())
            .then(d => {
                if (d.ok) {
                    setData(d.page);
                }
            });
    }, [params.id]);

    if (!data) return <div className="p-6 text-right text-white">جاري التحميل...</div>;

    return (
        <div className="p-6 h-full">
            <h1 className="text-2xl font-bold mb-6 text-right">تعديل صفحة SEO</h1>
            <SeoEditor initialData={data} />
        </div>
    );
}
