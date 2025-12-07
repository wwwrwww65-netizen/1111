"use client";
import React, { useState, useEffect } from 'react';
import ImageUploader from '../../components/ImageUploader';

export interface SeoData {
    slug: string;
    titleSeo: string;
    metaDescription: string;
    focusKeyword: string;
    canonicalUrl: string;
    metaRobots: string;
    schema: string;
    hiddenContent: string;
    ogTags: { title?: string; description?: string; image?: string };
    twitterCard: { title?: string; description?: string; image?: string };
}

interface ProductSeoEditorProps {
    data: SeoData;
    onChange: (data: Partial<SeoData>) => void;
    siteUrl?: string; // Optional site URL for previews
    siteName?: string;
    pathPrefix?: string; // e.g. /products/ or /c/
}

export default function ProductSeoEditor({ data, onChange, siteUrl, siteName, pathPrefix = '/p/' }: ProductSeoEditorProps) {
    const [activeTab, setActiveTab] = useState('general'); // general, social, advanced
    const [analysis, setAnalysis] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Helpers to update a single field
    const handleChange = (field: keyof SeoData, value: any) => {
        onChange({ [field]: value });
    };

    const handleSocialChange = (platform: 'ogTags' | 'twitterCard', field: string, value: string) => {
        const current = data[platform] || {};
        onChange({
            [platform]: { ...current, [field]: value }
        });
    };

    function getAuthHeaders() {
        if (typeof document === 'undefined') return {} as Record<string, string>;
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        let token = m ? m[1] : '';
        try { token = decodeURIComponent(token); } catch { }
        return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
    }

    const analyzeSeo = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/admin/seo/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            const resData = await res.json();
            if (resData.ok) {
                setAnalysis(resData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    // Auto analyze when main fields change (debounced)
    useEffect(() => {
        const timer = setTimeout(analyzeSeo, 1500);
        return () => clearTimeout(timer);
    }, [data.titleSeo, data.metaDescription, data.focusKeyword, data.slug]);

    const handlePreview = () => {
        const url = `${(siteUrl || 'https://jeeey.com').replace(/\/$/, '')}/${(data.slug || '').replace(/^\//, '')}`;
        window.open(url, '_blank');
    };

    const finalSiteUrl = (siteUrl || 'https://jeeey.com').replace(/\/$/, '');

    return (
        <div className="flex flex-col gap-6 text-right" dir="rtl">
            <div className="flex gap-4 border-b border-[#1f2937] pb-2">
                <button type="button" onClick={() => setActiveTab('general')} className={`pb-2 px-2 transition-colors ${activeTab === 'general' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>عام</button>
                <button type="button" onClick={() => setActiveTab('social')} className={`pb-2 px-2 transition-colors ${activeTab === 'social' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>التواصل الاجتماعي</button>
                <button type="button" onClick={() => setActiveTab('advanced')} className={`pb-2 px-2 transition-colors ${activeTab === 'advanced' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>متقدم</button>
                <button type="button" onClick={() => setActiveTab('analysis')} className={`pb-2 px-2 transition-colors ${activeTab === 'analysis' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>التحليل والمعاينة</button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">الرابط (Slug)</label>
                            <div className="flex items-center bg-[#0b0e14] border border-[#1f2937] rounded px-3">
                                <span className="text-gray-500 text-sm" dir="ltr">{finalSiteUrl}{pathPrefix}</span>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={e => handleChange('slug', e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-white w-full p-2 outline-none"
                                    placeholder="product-slug"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">عنوان الصفحة (SEO Title)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.titleSeo}
                                    onChange={e => handleChange('titleSeo', e.target.value)}
                                    className={`w-full bg-[#0b0e14] border ${data.titleSeo?.length > 70 ? 'border-red-500' : 'border-[#1f2937]'} rounded p-2 text-white text-sm focus:border-blue-500 outline-none`}
                                    placeholder="عنوان يظهر في محركات البحث"
                                />
                                <span className={`absolute left-2 top-2 text-xs ${data.titleSeo?.length > 60 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {data.titleSeo?.length || 0}/70
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">الوصف (Meta Description)</label>
                            <div className="relative">
                                <textarea
                                    value={data.metaDescription}
                                    onChange={e => handleChange('metaDescription', e.target.value)}
                                    className={`w-full bg-[#0b0e14] border ${data.metaDescription?.length > 160 ? 'border-red-500' : 'border-[#1f2937]'} rounded p-2 text-white h-24 text-sm focus:border-blue-500 outline-none`}
                                    placeholder="وصف مختصر ومحفز للنقر"
                                />
                                <span className={`absolute left-2 bottom-2 text-xs ${data.metaDescription?.length > 150 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {data.metaDescription?.length || 0}/160
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">الكلمات المفتاحية (Focus Keywords)</label>
                            <input
                                type="text"
                                value={data.focusKeyword}
                                onChange={e => handleChange('focusKeyword', e.target.value)}
                                className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                placeholder="الكلمة الأساسية، كلمة ثانوية (افصل بفاصلة)"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'social' && (
                    <div className="space-y-6">
                        <div className="border-b border-[#1f2937] pb-4">
                            <h3 className="text-sm font-semibold text-blue-400 mb-3">Facebook (Open Graph)</h3>
                            <div className="space-y-3">
                                <input
                                    placeholder="OG Title (اتركه فارغاً لاستخدام عنوان SEO)"
                                    value={data.ogTags?.title || ''}
                                    onChange={e => handleSocialChange('ogTags', 'title', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                />
                                <textarea
                                    placeholder="OG Description"
                                    value={data.ogTags?.description || ''}
                                    onChange={e => handleSocialChange('ogTags', 'description', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white h-20 text-sm focus:border-blue-500 outline-none"
                                />
                                <div className="text-gray-400 text-xs mb-1">صورة Facebook (OG Image)</div>
                                <ImageUploader
                                    value={data.ogTags?.image || ''}
                                    onChange={(url) => handleSocialChange('ogTags', 'image', url)}
                                    label=""
                                    hint="الحجم المثالي: 1200x630 بكسل"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-sky-400 mb-3">Twitter Card</h3>
                            <div className="space-y-3">
                                <input
                                    placeholder="Twitter Title"
                                    value={data.twitterCard?.title || ''}
                                    onChange={e => handleSocialChange('twitterCard', 'title', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                />
                                <textarea
                                    placeholder="Twitter Description"
                                    value={data.twitterCard?.description || ''}
                                    onChange={e => handleSocialChange('twitterCard', 'description', e.target.value)}
                                    className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white h-20 text-sm focus:border-blue-500 outline-none"
                                />
                                <div className="text-gray-400 text-xs mb-1">صورة Twitter</div>
                                <ImageUploader
                                    value={data.twitterCard?.image || ''}
                                    onChange={(url) => handleSocialChange('twitterCard', 'image', url)}
                                    label=""
                                    hint="الحجم المثالي: 1200x675 بكسل"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Canonical URL</label>
                            <input
                                type="text"
                                value={data.canonicalUrl}
                                onChange={e => handleChange('canonicalUrl', e.target.value)}
                                className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                placeholder="https://..."
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Meta Robots</label>
                            <select
                                value={data.metaRobots}
                                onChange={e => handleChange('metaRobots', e.target.value)}
                                className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                dir="ltr"
                            >
                                <option value="">Default (index, follow)</option>
                                <option value="index, follow">index, follow</option>
                                <option value="noindex, follow">noindex, follow</option>
                                <option value="index, nofollow">index, nofollow</option>
                                <option value="noindex, nofollow">noindex, nofollow</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">Schema (JSON-LD)</label>
                            <textarea
                                value={data.schema}
                                onChange={e => handleChange('schema', e.target.value)}
                                className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white font-mono text-sm h-32 focus:border-blue-500 outline-none"
                                dir="ltr"
                                placeholder="{ ... }"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1 text-sm">محتوى مخفي (Hidden Content)</label>
                            <textarea
                                value={data.hiddenContent}
                                onChange={e => handleChange('hiddenContent', e.target.value)}
                                className="w-full bg-[#0b0e14] border border-[#1f2937] rounded p-2 text-white text-sm h-24 focus:border-blue-500 outline-none"
                                placeholder="نص إضافي لمحركات البحث لا يظهر للمستخدم بشكل مباشر"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        {/* Analysis Score */}
                        <div className="bg-[#111827] p-4 rounded-lg border border-[#1f2937]">
                            <h3 className="font-bold text-gray-300 mb-2">تحليل SEO</h3>
                            {analyzing ? (
                                <div className="text-gray-400 text-sm">جاري التحليل...</div>
                            ) : analysis ? (
                                <>
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
                                </>
                            ) : (
                                <div className="text-gray-500 text-sm">لم يتم التحليل بعد. سيتم التحليل تلقائياً عند التعديل.</div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Google Snippet Preview */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase text-left">Google</h3>
                                <div className="font-sans text-right" dir="rtl">
                                    <div className="flex items-center gap-2 mb-1" dir="ltr">
                                        <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-xs">🌐</div>
                                        <div className="text-sm text-[#202124]">
                                            {finalSiteUrl.replace(/^https?:\/\//, '')} › {pathPrefix.replace(/^\/|\/$/g, '')} › {data.slug || 'slug'}
                                        </div>
                                        <div className="text-xs text-gray-500">⋮</div>
                                    </div>
                                    <div className="text-[#1a0dab] text-lg hover:underline cursor-pointer truncate font-medium">
                                        {data.titleSeo || 'عنوان المنتج'} | {siteName || 'Jeeey'}
                                    </div>
                                    <div className="text-[#4d5156] text-sm mt-1 line-clamp-2">
                                        {data.metaDescription || 'وصف المنتج يظهر هنا في نتائج البحث.'}
                                    </div>
                                </div>
                            </div>

                            {/* Social Preview */}
                            <div className="bg-[#111827] p-4 rounded-lg border border-[#1f2937]">
                                <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase text-left">Social Share</h3>
                                <div className="bg-[#1f2937] rounded overflow-hidden border border-gray-700">
                                    {data.ogTags?.image ? (
                                        <img src={data.ogTags.image} alt="OG" className="w-full h-32 object-cover" />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-800 flex items-center justify-center text-gray-600">No Image</div>
                                    )}
                                    <div className="p-3">
                                        <div className="text-gray-400 text-xs uppercase mb-1">{finalSiteUrl.replace(/^https?:\/\//, '').toUpperCase()}</div>
                                        <div className="font-bold text-white mb-1 truncate text-sm">{data.ogTags?.title || data.titleSeo || 'العنوان'}</div>
                                        <div className="text-gray-400 text-xs line-clamp-2">{data.ogTags?.description || data.metaDescription || 'الوصف'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={handlePreview} className="text-sm text-blue-400 hover:text-blue-300">معاينة الرابط ↗</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
