import React from 'react';
import { useRouter } from 'next/navigation';

interface Zone {
  id: string;
  name: string;
}

interface ShippingRateFormProps {
  initialData?: any;
  zones: Zone[];
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  isEdit?: boolean;
}

export default function ShippingRateForm({ initialData, zones, onSubmit, loading, isEdit }: ShippingRateFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  // Form State
  const [zoneId, setZoneId] = React.useState(initialData?.zoneId || '');
  const [excludedZoneIds, setExcludedZoneIds] = React.useState<string[]>(initialData?.excludedZoneIds || []);
  const [carrier, setCarrier] = React.useState(initialData?.carrier || '');
  const [baseFee, setBaseFee] = React.useState<number>(initialData?.baseFee || 0);
  const [perKgFee, setPerKgFee] = React.useState<number | ''>(initialData?.perKgFee ?? '');
  const [minWeightKg, setMinWeightKg] = React.useState<number | ''>(initialData?.minWeightKg ?? '');
  const [maxWeightKg, setMaxWeightKg] = React.useState<number | ''>(initialData?.maxWeightKg ?? '');
  const [minSubtotal, setMinSubtotal] = React.useState<number | ''>(initialData?.minSubtotal ?? '');
  const [freeOverSubtotal, setFreeOverSubtotal] = React.useState<number | ''>(initialData?.freeOverSubtotal ?? '');
  const [etaMinHours, setEtaMinHours] = React.useState<number | ''>(initialData?.etaMinHours ?? '');
  const [etaMaxHours, setEtaMaxHours] = React.useState<number | ''>(initialData?.etaMaxHours ?? '');
  const [offerTitle, setOfferTitle] = React.useState(initialData?.offerTitle || '');
  const [activeFrom, setActiveFrom] = React.useState<string>(initialData?.activeFrom ? String(initialData.activeFrom).slice(0, 10) : '');
  const [activeUntil, setActiveUntil] = React.useState<string>(initialData?.activeUntil ? String(initialData.activeUntil).slice(0, 10) : '');
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true);

  // Search state for Exclude Zones
  const [excludeSearch, setExcludeSearch] = React.useState('');

  const filteredExcludeZones = zones.filter(z =>
    z.id !== zoneId &&
    z.name.toLowerCase().includes(excludeSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        zoneId,
        excludedZoneIds,
        carrier: carrier || undefined,
        baseFee: Number(baseFee),
        perKgFee: perKgFee === '' ? undefined : Number(perKgFee),
        minWeightKg: minWeightKg === '' ? undefined : Number(minWeightKg),
        maxWeightKg: maxWeightKg === '' ? undefined : Number(maxWeightKg),
        minSubtotal: minSubtotal === '' ? undefined : Number(minSubtotal),
        freeOverSubtotal: freeOverSubtotal === '' ? undefined : Number(freeOverSubtotal),
        etaMinHours: etaMinHours === '' ? undefined : Number(etaMinHours),
        etaMaxHours: etaMaxHours === '' ? undefined : Number(etaMaxHours),
        offerTitle: offerTitle || undefined,
        activeFrom: activeFrom || undefined,
        activeUntil: activeUntil || undefined,
        isActive
      };
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message || 'failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">نطاق التوصيل</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المنطقة المستهدفة (Target Zone)
          </label>
          <select
            value={zoneId}
            onChange={e => { setZoneId(e.target.value); setExcludedZoneIds(prev => prev.filter(id => id !== e.target.value)); }}
            disabled={isEdit}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
            required
          >
            <option value="">اختر منطقة...</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          {isEdit && <p className="mt-1 text-xs text-gray-500">لا يمكن تغيير المنطقة بعد الإنشاء</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            استثناء مناطق (Exclude Zones)
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <input
              type="text"
              placeholder="بحث في المناطق..."
              value={excludeSearch}
              onChange={e => setExcludeSearch(e.target.value)}
              className="w-full mb-3 rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredExcludeZones.map(z => (
                <label key={z.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={excludedZoneIds.includes(z.id)}
                    onChange={e => {
                      if (e.target.checked) setExcludedZoneIds(prev => [...prev, z.id]);
                      else setExcludedZoneIds(prev => prev.filter(id => id !== z.id));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {z.name}
                </label>
              ))}
              {filteredExcludeZones.length === 0 && <div className="text-sm text-gray-500 text-center py-2">لا توجد مناطق مطابقة</div>}
            </div>
            {excludedZoneIds.length > 0 && (
              <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                تم استثناء {excludedZoneIds.length} مناطق
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المشغل (Carrier)</label>
          <input
            type="text"
            value={carrier}
            onChange={e => setCarrier(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder="مثال: DHL, سمسا"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان العرض (Offer Title)</label>
          <input
            type="text"
            value={offerTitle}
            onChange={e => setOfferTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder="مثال: توصيل سريع"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأساسي <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="0.01"
            value={baseFee}
            onChange={e => setBaseFee(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رسوم لكل كجم إضافي</label>
          <input
            type="number"
            step="0.01"
            value={perKgFee}
            onChange={e => setPerKgFee(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوزن الأدنى (كجم)</label>
          <input
            type="number"
            step="0.01"
            value={minWeightKg}
            onChange={e => setMinWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوزن الأقصى (كجم)</label>
          <input
            type="number"
            step="0.01"
            value={maxWeightKg}
            onChange={e => setMaxWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للطلب</label>
          <input
            type="number"
            step="0.01"
            value={minSubtotal}
            onChange={e => setMinSubtotal(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">شحن مجاني فوق</label>
          <input
            type="number"
            step="0.01"
            value={freeOverSubtotal}
            onChange={e => setFreeOverSubtotal(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">مدة التوصيل (من ساعة)</label>
          <input
            type="number"
            value={etaMinHours}
            onChange={e => setEtaMinHours(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">مدة التوصيل (إلى ساعة)</label>
          <input
            type="number"
            value={etaMaxHours}
            onChange={e => setEtaMaxHours(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ساري من</label>
          <input
            type="date"
            value={activeFrom}
            onChange={e => setActiveFrom(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ساري إلى</label>
          <input
            type="date"
            value={activeUntil}
            onChange={e => setActiveUntil(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-900">مفعّل (Active)</span>
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving || loading || (!zoneId && !isEdit)}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
