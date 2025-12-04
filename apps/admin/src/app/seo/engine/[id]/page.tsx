"use client";
import React, { useEffect, useState } from 'react';
import SeoEditor from '../components/SeoEditor';

export default function EditSeoPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('/api/admin/seo/pages')
            .then(res => res.json())
            .then(d => {
                if (d.ok) {
                    const page = d.pages.find((p: any) => p.id === params.id);
                    setData(page);
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
