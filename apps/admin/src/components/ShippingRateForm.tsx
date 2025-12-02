import React from 'react';
import { useRouter } from 'next/navigation';
import { Combobox } from './ui/combobox';

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
  const [baseFee, setBaseFee] = React.useState<string>(initialData?.baseFee ? String(initialData.baseFee) : '');
  const [perKgFee, setPerKgFee] = React.useState<string>(initialData?.perKgFee ? String(initialData.perKgFee) : '');
  const [minWeightKg, setMinWeightKg] = React.useState<string>(initialData?.minWeightKg ? String(initialData.minWeightKg) : '');
  const [maxWeightKg, setMaxWeightKg] = React.useState<string>(initialData?.maxWeightKg ? String(initialData.maxWeightKg) : '');
  const [minSubtotal, setMinSubtotal] = React.useState<string>(initialData?.minSubtotal ? String(initialData.minSubtotal) : '');
  const [freeOverSubtotal, setFreeOverSubtotal] = React.useState<string>(initialData?.freeOverSubtotal ? String(initialData.freeOverSubtotal) : '');
  const [etaMinHours, setEtaMinHours] = React.useState<string>(initialData?.etaMinHours ? String(initialData.etaMinHours) : '');
  const [etaMaxHours, setEtaMaxHours] = React.useState<string>(initialData?.etaMaxHours ? String(initialData.etaMaxHours) : '');
  const [offerTitle, setOfferTitle] = React.useState(initialData?.offerTitle || '');
  const [activeFrom, setActiveFrom] = React.useState<string>(initialData?.activeFrom ? String(initialData.activeFrom).slice(0, 10) : '');
  const [activeUntil, setActiveUntil] = React.useState<string>(initialData?.activeUntil ? String(initialData.activeUntil).slice(0, 10) : '');
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? true);

  const zoneOptions = zones.map(z => ({ value: z.id, label: z.name }));
  
  // Filter out the selected target zone from the excluded zones options
  const excludedZoneOptions = zoneOptions.filter(z => z.value !== zoneId);

  const handleNumberChange = (val: string, setter: (v: string) => void) => {
    // Allow digits and one decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setter(val);
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {isEdit ? 'تعديل سعر الشحن' : 'إضافة سعر شحن جديد'}
          </h1>
          <p className="text-[var(--sub)] mt-1">قم بتكوين أسعار الشحن للمناطق المختلفة</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[var(--panel)] px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)]">
            <span className="text-sm font-medium text-[var(--sub)]">الحالة:</span>
            <div dir="ltr" className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--muted)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
            <span className={`text-sm font-medium ${isActive ? 'text-green-500' : 'text-[var(--sub)]'}`}>{isActive ? 'مفعّل' : 'معطل'}</span>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving || loading || (!zoneId && !isEdit)}
            className="btn"
          >
            {saving && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-400 bg-red-900/20 rounded-lg border border-red-900/50 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="panel">
        <div className="flex items-center justify-between mb-6 border-b border-[rgba(255,255,255,0.06)] pb-4">
          <h3 className="h3 flex items-center gap-2 text-[var(--text)] mb-0">
            <svg className="w-5 h-5 text-[var(--primary)] flex-shrink-0" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            نطاق التوصيل
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="form-label">المنطقة المستهدفة (Target Zone) <span className="text-red-500">*</span></label>
              <Combobox
                options={zoneOptions}
                value={zoneId}
                onChange={(val) => {
                  setZoneId(val);
                  // Remove selected zone from excluded list if it was there
                  setExcludedZoneIds(prev => prev.filter(id => id !== val));
                }}
                placeholder="اختر منطقة..."
                disabled={isEdit}
              />
              {isEdit && <p className="mt-1.5 text-xs text-[var(--sub)] flex items-center gap-1"><svg className="w-3 h-3 flex-shrink-0" style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> لا يمكن تغيير المنطقة بعد الإنشاء</p>}
            </div>

            <div>
              <label className="form-label">المشغل (Carrier)</label>
              <div className="relative">
                <input
                  type="text"
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="input"
                  placeholder="مثال: DHL, سمسا"
                />
              </div>
            </div>

            <div>
              <label className="form-label">عنوان العرض (Offer Title)</label>
              <input
                type="text"
                value={offerTitle}
                onChange={e => setOfferTitle(e.target.value)}
                className="input"
                placeholder="مثال: توصيل سريع خلال 24 ساعة"
              />
            </div>
          </div>

          <div>
            <label className="form-label">استثناء مناطق (Exclude Zones)</label>
            <Combobox
              options={excludedZoneOptions}
              value={excludedZoneIds}
              onChange={setExcludedZoneIds}
              placeholder="بحث وتحديد مناطق للاستثناء..."
              multiple
            />
            <p className="mt-2 text-xs text-[var(--sub)]">
              المناطق المحددة هنا لن يطبق عليها هذا السعر حتى لو كانت ضمن المنطقة المستهدفة.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pricing Card */}
        <div className="panel">
          <div className="mb-6 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <h3 className="h3 flex items-center gap-2 text-[var(--text)] mb-0">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              التسعير
            </h3>
          </div>
          <div className="space-y-6">
            <div className="form-grid">
              <div>
                <label className="form-label">السعر الأساسي <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={baseFee}
                    onChange={e => handleNumberChange(e.target.value, setBaseFee)}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">لكل كجم إضافي</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={perKgFee}
                    onChange={e => handleNumberChange(e.target.value, setPerKgFee)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
              <label className="form-label">شحن مجاني للطلبات فوق</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={freeOverSubtotal}
                  onChange={e => handleNumberChange(e.target.value, setFreeOverSubtotal)}
                  className="input"
                  placeholder="اتركه فارغاً للتعطيل"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conditions Card */}
        <div className="panel">
          <div className="mb-6 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <h3 className="h3 flex items-center gap-2 text-[var(--text)] mb-0">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              الشروط والقيود
            </h3>
          </div>
          <div className="space-y-6">
            <div className="form-grid">
              <div>
                <label className="form-label">الوزن الأدنى (كجم)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={minWeightKg}
                  onChange={e => handleNumberChange(e.target.value, setMinWeightKg)}
                  className="input"
                />
              </div>
              <div>
                <label className="form-label">الوزن الأقصى (كجم)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={maxWeightKg}
                  onChange={e => handleNumberChange(e.target.value, setMaxWeightKg)}
                  className="input"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">الحد الأدنى للطلب</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={minSubtotal}
                  onChange={e => handleNumberChange(e.target.value, setMinSubtotal)}
                  className="input"
                />
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label className="form-label">مدة التوصيل (من)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={etaMinHours}
                    onChange={e => handleNumberChange(e.target.value, setEtaMinHours)}
                    className="input pl-12"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[var(--sub)] text-sm">ساعة</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label">مدة التوصيل (إلى)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={etaMaxHours}
                    onChange={e => handleNumberChange(e.target.value, setEtaMaxHours)}
                    className="input pl-12"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[var(--sub)] text-sm">ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validity Card */}
      <div className="panel">
        <div className="mb-6 border-b border-[rgba(255,255,255,0.06)] pb-4">
          <h3 className="h3 flex items-center gap-2 text-[var(--text)] mb-0">
            <svg className="w-5 h-5 text-purple-500 flex-shrink-0" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            الصلاحية
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">ساري من</label>
            <input
              type="date"
              value={activeFrom}
              onChange={e => setActiveFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="form-label">ساري إلى</label>
            <input
              type="date"
              value={activeUntil}
              onChange={e => setActiveUntil(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
