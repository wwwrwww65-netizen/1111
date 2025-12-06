"use client";
import SeoEditor from '../components/SeoEditor';

export default function CreateSeoPage() {
    return (
        <div className="p-6 h-full">
            <h1 className="text-2xl font-bold mb-6 text-right">إضافة صفحة SEO جديدة</h1>
            <SeoEditor isNew={true} />
        </div>
    );
}
