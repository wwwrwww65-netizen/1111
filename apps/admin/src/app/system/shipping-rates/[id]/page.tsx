"use client";
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import ShippingRateForm from '../../../../components/ShippingRateForm';

export default function EditShippingRatePage(): JSX.Element {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [zones, setZones] = React.useState<any[]>([]);
    const [rate, setRate] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        (async () => {
            try {
                // Load Zones
                const zr = await fetch('/api/admin/shipping/zones', { credentials: 'include' });
                const zj = await zr.json();
                if (zr.ok) setZones(zj.zones || []);

                // Load Rate Details
                if (id) {
                    const rr = await fetch('/api/admin/shipping/rates', { credentials: 'include' });
                    const rj = await rr.json();
                    if (rr.ok) {
                        const foundRate = (rj.rates || []).find((r: any) => r.id === id);
                        if (foundRate) {
                            setRate(foundRate);
                        } else {
                            setError('Rate not found');
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    async function submit(data: any) {
        const r = await fetch(`/api/admin/shipping/rates/${id}`, {
            method: 'PUT',
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

    if (error) return (
        <div className="container mx-auto p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                {error}
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">تعديل سعر التوصيل</h1>
                {rate && <ShippingRateForm initialData={rate} zones={zones} onSubmit={submit} isEdit={true} />}
            </div>
        </div>
    );
}
