"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '../../../components/ImageUploader';
import { apiFetch } from '../../../lib/api';

export default function SeoEditor({ initialData, isNew = false }: { initialData?: any, isNew?: boolean }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        slug: '',
        titleSeo: '',
        metaDescription: '',
        focusKeyword: '',
        canonicalUrl: '',
        metaRobots: 'index, follow',
        schema: '{}',
        breadcrumbs: true,
        hiddenContent: '',
        ...initialData,
        ogTags: { title: '', description: '', image: '', ...(initialData?.ogTags || {}) },
        twitterCard: { title: '', description: '', image: '', ...(initialData?.twitterCard || {}) },
    });

    const [analysis, setAnalysis] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // general, social, advanced
    const [siteUrl, setSiteUrl] = useState('');
    const [siteName, setSiteName] = useState('');
    const [siteLogo, setSiteLogo] = useState('');

    useEffect(() => {
        // Load global settings for preview
        apiFetch<any>('/api/admin/settings/list')
            .then(data => {
                const settings = data.settings || [];
                const u = settings.find((s: any) => s.key === 'site_url');
                const n = settings.find((s: any) => s.key === 'site_name');
                const l = settings.find((s: any) => s.key === 'site_logo');
                if (u?.value?.value) setSiteUrl(u.value.value);
                if (n?.value?.value) setSiteName(n.value.value);
                if (l?.value?.value) setSiteLogo(l.value.value);
            })
            .catch(() => { });
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSocialChange = (platform: 'ogTags' | 'twitterCard', field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [platform]: { ...prev[platform], [field]: value }
        }));
    };

    const analyzeSeo = async () => {
        try {
            const data = await apiFetch<any>('/api/admin/seo/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (data.ok) {
                setAnalysis(data);
            }
        } catch { }
    };

    const saveSeo = async () => {
        // Validation
        if (!formData.slug) return alert('الرابط (Slug) مطلوب');
        // Simple slug regex: alphanumeric, dash, underscore, slash, dot
        if (!/^[a-zA-Z0-9-_\/.]+$/.test(formData.slug)) {
            return alert('الرابط يحتوي على رموز غير مسموحة. استخدم فقط الحروف والأرقام والشرطات (-).');
        }

        setSaving(true);
        try {
            const isUpdate = !!(formData as any).id;
            const url = isUpdate ? `/api/admin/seo/pages/${(formData as any).id}` : '/api/admin/seo/pages';
            const method = isUpdate ? 'PUT' : 'POST';

            const data = await apiFetch<any>(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (data.ok) {
                alert('تم الحفظ بنجاح');
                router.push('/seo/engine');
                router.refresh();
            } else {
                alert('خطأ في الحفظ: ' + (data.error || 'Unknown'));
            }
        } catch (e: any) {
            alert('خطأ في الاتصال: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePreview = () => {
        const url = `${(siteUrl || 'https://jeeey.com').replace(/\/$/, '')}/${formData.slug.replace(/^\//, '')}`;
        window.open(url, '_blank');
    };

    useEffect(() => {
        const timer = setTimeout(analyzeSeo, 1000);
        return () => clearTimeout(timer);
    }, [formData.titleSeo, formData.metaDescription, formData.focusKeyword, formData.slug]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full text-right" dir="rtl">
            {/* Main Fields (65%) */}
            <div className="flex-1 lg:w-[65%] space-y-6">
                <div className="bg-[#111827] p-6 rounded-lg border border-[#1f2937]">
                    <div className="flex gap-4 mb-6 border-b border-[#1f2937] pb-2">
                        <button onClick={() => setActiveTab('general')} className={`pb-2 ${activeTab === 'general' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>عام</button>
                        <button onClick={() => setActiveTab('social')} className={`pb-2 ${activeTab === 'social' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>التواصل الاجتماعي</button>
                        <button onClick={() => setActiveTab('advanced')} className={`pb-2 ${activeTab === 'advanced' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>متقدم</button>
                    </div>

                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">الرابط (Slug) <span className="text-red-500">*</span></label>
                                <div className="flex items-center bg-[#0b0e14] border border-[#1f2937] rounded px-3">
                                    <span className="text-gray-500 text-sm">{(siteUrl || 'https://jeeey.com').replace(/\/$/, '')}/</span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={e => handleChange('slug', e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-white w-full p-2"
                                        placeholder="my-page-url"
                                        dir="ltr"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">يجب أن يكون فريداً لكل صفحة (مثال: /, /about, /terms)</p>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">عنوان الصفحة (SEO Title)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.titleSeo}
                                        onChange={e => handleChange('titleSeo', e.target.value)}
                                        className={`w-full bg-[#0b0e14] border ${formData.titleSeo.length > 70 ? 'border-red-500' : 'border-[#1f2937]'} rounded p-2 text-white`}
                                        placeholder="عنوان يظهر في محركات البحث"
                                    />
                                    <span className={`absolute left-2 top-2 text-xs ${formData.titleSeo.length > 60 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {formData.titleSeo.length}/70
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">الوصف (Meta Description)</label>
                                <div className="relative">
                                    <textarea
                                        value={formData.metaDescription}
                                        onChange={e => handleChange('metaDescription', e.target.value)}
                                        className={`w-full bg-[#0b0e14] border ${formData.metaDescription.length > 160 ? 'border-red-500' : 'border-[#1f2937]'} rounded p-2 text-white h-24`}
                                        placeholder="وصف مختصر ومحفز للنقر"
                                    />
                                    <span className={`absolute left-2 bottom-2 text-xs ${formData.metaDescription.length > 150 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {formData.metaDescription.length}/160
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">الكلمات المفتاحية (Focus Keywords)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🔑</span>
                                    <input
                                        type="text"
                                        value={formData.focusKeyword}
                                        onChange={e => handleChange('focusKeyword', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                        placeholder="الكلمة الأساسية، كلمة ثانوية (افصل بفاصلة)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-6">
                            <div className="border-b border-[#1f2937] pb-4">
                                <h3 className="text-lg font-semibold text-blue-400 mb-3">Facebook (Open Graph)</h3>
                                <div className="space-y-3">
                                    <input
                                        placeholder="OG Title (اتركه فارغاً لاستخدام عنوان SEO)"
                                        value={formData.ogTags.title}
                                        onChange={e => handleSocialChange('ogTags', 'title', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                    />
                                    <textarea
                                        placeholder="OG Description"
                                        value={formData.ogTags.description}
                                        onChange={e => handleSocialChange('ogTags', 'description', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white h-20"
                                    />
                                    <ImageUploader
                                        value={formData.ogTags.image}
                                        onChange={(url) => handleSocialChange('ogTags', 'image', url)}
                                        label="صورة Facebook (OG Image)"
                                        hint="الحجم المثالي: 1200x630 بكسل"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-sky-400 mb-3">Twitter Card</h3>
                                <div className="space-y-3">
                                    <input
                                        placeholder="Twitter Title"
                                        value={formData.twitterCard.title}
                                        onChange={e => handleSocialChange('twitterCard', 'title', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                    />
                                    <textarea
                                        placeholder="Twitter Description"
                                        value={formData.twitterCard.description}
                                        onChange={e => handleSocialChange('twitterCard', 'description', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white h-20"
                                    />
                                    <ImageUploader
                                        value={formData.twitterCard.image}
                                        onChange={(url) => handleSocialChange('twitterCard', 'image', url)}
                                        label="صورة Twitter"
                                        hint="الحجم المثالي: 1200x675 بكسل"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Canonical URL</label>
                                <input
                                    type="text"
                                    value={formData.canonicalUrl}
                                    onChange={e => handleChange('canonicalUrl', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                    placeholder="https://..."
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Meta Robots</label>
                                <select
                                    value={formData.metaRobots}
                                    onChange={e => handleChange('metaRobots', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                    dir="ltr"
                                >
                                    <option value="index, follow">index, follow</option>
                                    <option value="noindex, follow">noindex, follow</option>
                                    <option value="index, nofollow">index, nofollow</option>
                                    <option value="noindex, nofollow">noindex, nofollow</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Alternate Links (Hreflang JSON)</label>
                                <textarea
                                    value={formData.alternateLinks || ''}
                                    onChange={e => handleChange('alternateLinks', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white font-mono text-sm h-24"
                                    dir="ltr"
                                    placeholder='{ "en": "https://jeeey.com/en/page", "ar": "https://jeeey.com/page" }'
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Schema (JSON-LD)</label>
                                <textarea
                                    value={formData.schema}
                                    onChange={e => handleChange('schema', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white font-mono text-sm h-32"
                                    dir="ltr"
                                    placeholder='{ "@context": "https://schema.org", ... }'
                                />
                            </div>

                            {/* New Advanced Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1f2937] pt-4">
                                <div>
                                    <label className="block text-gray-400 mb-1">أولوية Sitemap (0.0 - 1.0)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={formData.sitemapPriority !== undefined ? formData.sitemapPriority : ''}
                                        onChange={e => handleChange('sitemapPriority', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                        placeholder="0.8"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">تحديث Sitemap (Frequency)</label>
                                    <select
                                        value={formData.sitemapFrequency || ''}
                                        onChange={e => handleChange('sitemapFrequency', e.target.value)}
                                        className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                        dir="ltr"
                                    >
                                        <option value="">(الافتراضي)</option>
                                        <option value="always">Always</option>
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="never">Never</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">المؤلف (Author)</label>
                                <input
                                    type="text"
                                    value={formData.author || ''}
                                    onChange={e => handleChange('author', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white"
                                    placeholder="اسم الكاتب أو الناشر"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">محتوى مخفي (Hidden Content)</label>
                                <textarea
                                    value={formData.hiddenContent || ''}
                                    onChange={e => handleChange('hiddenContent', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white h-24"
                                    placeholder="محتوى إضافي لمحركات البحث لا يظهر للمستخدم (استخدم بحذر)"
                                />
                                <p className="text-xs text-yellow-500 mt-1">تنبيه: محركات البحث قد تعاقب المواقع التي تستخدم النصوص المخفية بشكل مفرط (Cloaking).</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.breadcrumbs}
                                    onChange={e => handleChange('breadcrumbs', e.target.checked)}
                                    id="breadcrumbs"
                                />
                                <label htmlFor="breadcrumbs" className="text-gray-300">تفعيل Breadcrumbs</label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview & Tools (35%) */}
            <div className="lg:w-[35%] space-y-6">
                {/* Actions */}
                <div className="bg-[#111827] p-4 rounded-lg border border-[#1f2937] flex flex-col gap-3">
                    <button
                        onClick={saveSeo}
                        disabled={saving}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex justify-center items-center gap-2"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ ونشر'}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handlePreview} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded">معاينة</button>
                        <button onClick={() => setFormData(initialData || {})} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded">إعادة تعيين</button>
                    </div>
                </div>

                {/* Analysis Score */}
                {analysis && (
                    <div className="bg-[#111827] p-4 rounded-lg border border-[#1f2937]">
                        <h3 className="font-bold text-gray-300 mb-2">تحليل SEO</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`text-3xl font-bold ${analysis.score >= 80 ? 'text-green-500' : analysis.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {analysis.score}/100
                            </div>
                            <div className="text-sm text-gray-400">
                                {analysis.score >= 80 ? 'ممتاز! 🚀' : 'يحتاج تحسين ⚠️'}
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm">
                            {analysis.issues?.map((issue: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-red-400">
                                    <span>❌</span>
                                    <span>{issue}</span>
                                </li>
                            ))}
                            {analysis.score === 100 && <li className="text-green-400">✅ كل شيء يبدو رائعاً!</li>}
                        </ul>
                    </div>
                )}

                {/* Google Snippet Preview */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Google Preview</h3>
                    <div className="font-sans" dir="rtl">
                        <div className="flex items-center gap-2 mb-1" dir="ltr">
                            {siteLogo ? (
                                <img src={siteLogo} alt="Logo" className="w-6 h-6 object-contain rounded-full" />
                            ) : (
                                <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-xs">🌐</div>
                            )}
                            <div className="text-sm text-[#202124]">
                                {(siteUrl || 'jeeey.com').replace(/^https?:\/\//, '').replace(/\/$/, '')} › {formData.slug || 'page-url'}
                            </div>
                            <div className="text-xs text-gray-500">⋮</div>
                        </div>
                        <div className="text-[#1a0dab] text-xl hover:underline cursor-pointer truncate">
                            {formData.titleSeo || 'عنوان الصفحة'} | {siteName || initialData?.siteName || 'اسم الموقع'}
                        </div>
                        <div className="text-[#4d5156] text-sm mt-1 line-clamp-2">
                            {formData.metaDescription || 'وصف الصفحة يظهر هنا. هذا النص يساعد المستخدمين على فهم محتوى الصفحة قبل النقر عليها.'}
                        </div>
                    </div>
                </div>

                {/* Social Preview */}
                <div className="bg-[#111827] p-4 rounded-lg border border-[#1f2937]">
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Social Share</h3>
                    <div className="bg-[#1f2937] rounded overflow-hidden border border-gray-700">
                        {formData.ogTags.image ? (
                            <img src={formData.ogTags.image} alt="OG" className="w-full h-40 object-cover" />
                        ) : (
                            <div className="w-full h-40 bg-gray-800 flex items-center justify-center text-gray-600">No Image</div>
                        )}
                        <div className="p-3">
                            <div className="text-gray-400 text-xs uppercase mb-1">{(siteUrl || 'JEEEY.COM').replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase()}</div>
                            <div className="font-bold text-white mb-1 truncate">{formData.ogTags.title || formData.titleSeo || 'العنوان'}</div>
                            <div className="text-gray-400 text-sm line-clamp-2">{formData.ogTags.description || formData.metaDescription || 'الوصف'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
