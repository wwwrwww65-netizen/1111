"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import ShippingRateForm from '../../../../components/ShippingRateForm';

export default function NewShippingRatePage(): JSX.Element {
    const router = useRouter();
    const [zones, setZones] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/admin/shipping/zones', { credentials: 'include' });
                const j = await r.json();
                if (r.ok) setZones(j.zones || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function submit(data: any) {
        const r = await fetch('/api/admin/shipping/rates', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'failed');
        router.push('/system/shipping-rates');
    }

    if (loading) return (
        <div className="container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                    <div className="h-40 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">إضافة سعر توصيل جديد</h1>
                <ShippingRateForm zones={zones} onSubmit={submit} />
            </div>
        </div>
    );
}
