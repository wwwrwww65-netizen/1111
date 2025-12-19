"use client";
import { trpc } from "../../providers";
import Image from "next/image";
import React from "react";
import { ProductCard } from "@repo/ui";
import { useI18n } from "../../../lib/i18n";
import { useAuthStore } from "@repo/ui/src/store/auth";
function themeClass(theme?: string): string {
    switch (theme) {
        case 'rose': return 'bg-rose-50 hover:bg-rose-100 text-rose-700';
        case 'amber': return 'bg-amber-50 hover:bg-amber-100 text-amber-700';
        case 'emerald': return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700';
        case 'violet': return 'bg-violet-50 hover:bg-violet-100 text-violet-700';
        default: return 'bg-orange-50 hover:bg-orange-100 text-orange-700';
    }
}
function themeBg(theme?: string): string {
    switch (theme) {
        case 'rose': return '#f43f5e';
        case 'amber': return '#f59e0b';
        case 'emerald': return '#10b981';
        case 'violet': return '#7c3aed';
        default: return '#f97316';
    }
}

export default function ProductDetailClient({ slug }: { slug: string }): JSX.Element {
    const { t } = useI18n();
    // Use slug to fetch product - supports both slug and id lookup
    const { data, isLoading, error } = trpc.products.getById.useQuery({ id: slug });
    const rpc = trpc;
    const addItem = trpc.cart.addItem.useMutation();
    const createReview = trpc.reviews.create.useMutation();
    const [activeIdx, setActiveIdx] = React.useState(0);
    const [qty, setQty] = React.useState(1);
    const [tab, setTab] = React.useState<'desc' | 'specs' | 'reviews'>("desc");
    const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
    const [selectedSizes, setSelectedSizes] = React.useState<Record<string, string>>({});
    const [showShip, setShowShip] = React.useState(false);
    const [showReturn, setShowReturn] = React.useState(false);
    const [rating, setRating] = React.useState(5);
    const [comment, setComment] = React.useState("");
    const isAuth = useAuthStore((s) => s.isAuthenticated);
    const [reviewSort, setReviewSort] = React.useState<'newest' | 'highest' | 'lowest'>('newest');
    const [reviewStarFilter, setReviewStarFilter] = React.useState<number | null>(null);

    if (isLoading) return <main className="p-8">Loading product...</main>;
    if (error) return <main className="p-8">Error: {error.message}</main>;
    if (!data) return <main className="p-8">Not found</main>;

    const product = data;
    const [clubMeta, setClubMeta] = React.useState<any>(null);
    React.useEffect(() => {
        (async () => {
            try { const r = await fetch(`/api/product/${encodeURIComponent(product.id)}/meta`, { headers: { 'accept': 'application/json' } }); const j = await r.json(); setClubMeta(j?.meta?.clubBanner || null); } catch { setClubMeta(null); }
        })();
    }, [product.id]);
    const images = product.images && product.images.length ? product.images : ["/images/placeholder-product.jpg"];
    const variants = Array.isArray((product as any).variants) ? (product as any).variants : [];
    // Build dimension sets from server-provided attributes (preferred) or derive from variants
    const colorSet = new Set<string>();
    const sizeGroups = new Map<string, Set<string>>();
    const normToken = (s: string) => String(s || '').trim().toLowerCase();
    const isColorWord = (s: string): boolean => {
        const t = normToken(s);
        if (!t) return false;
        const COLOR_WORDS = new Set<string>([
            'احمر', 'أحمر', 'red', 'ازرق', 'أزرق', 'blue', 'اخضر', 'أخضر', 'green', 'اصفر', 'أصفر', 'yellow', 'وردي', 'زهري', 'pink', 'اسود', 'أسود', 'black', 'ابيض', 'أبيض', 'white', 'بنفسجي', 'violet', 'purple', 'برتقالي', 'orange', 'بني', 'brown', 'رمادي', 'gray', 'grey', 'سماوي', 'turquoise', 'تركوازي', 'تركواز', 'بيج', 'beige', 'كحلي', 'navy', 'ذهبي', 'gold', 'فضي', 'silver',
            // Arabic commercial color names
            'دم الغزال', 'لحمي', 'خمري', 'عنابي', 'طوبي'
        ]);
        if (COLOR_WORDS.has(t)) return true;
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return true;
        if (/^[\u0600-\u06FF\s]{2,}$/.test(s) && /ي$/.test(s)) return true;
        return false;
    };
    const normalizeDigits = (input: string): string => String(input || '').replace(/[\u0660-\u0669]/g, (d) => String((d as any).charCodeAt(0) - 0x0660));
    const looksSizeToken = (s: string): boolean => {
        const t = normToken(normalizeDigits(s));
        if (!t) return false;
        if (/^(xxs|xs|s|m|l|xl|xxl|xxxl|xxxxl|xxxxxl|xxxxxxl)$/i.test(t)) return true;
        if (/^\d{1,2}xl$/i.test(t)) return true; // 2XL, 3XL etc.
        if (/^(\d{2}|\d{1,3})$/.test(t)) return true;
        if (/^(صغير|وسط|متوسط|كبير|كبير جدا|فري|واحد|حر|طفل|للرضع|للنساء|للرجال|واسع|ضيّق)$/.test(t)) return true;
        return false;
    };
    const splitTokens = (s: string): string[] => String(s || '').split(/[\s,،\/\-\|·•:]+/).map(x => x.trim()).filter(Boolean);
    const tryParseMeta = (raw: string): any => { try { return JSON.parse(raw); } catch { return null; } };
    // Prefer attributes returned by API (products.getById enriched via server)
    const apiAttributes: Array<{ key: string; label: string; values: string[] }> = Array.isArray((product as any).attributes) ? (product as any).attributes : [];
    if (apiAttributes.length) {
        for (const a of apiAttributes) {
            if (a.key === 'color') {
                for (const v of a.values) colorSet.add(String(v));
            } else if (a.key === 'size') {
                const label = String(a.label || 'المقاس');
                if (!sizeGroups.has(label)) sizeGroups.set(label, new Set());
                for (const v of a.values) sizeGroups.get(label)!.add(String(v));
            }
        }
    }
    // Derive as fallback when attributes are not present (backward compatible)
    if (colorSet.size === 0 && sizeGroups.size === 0) for (const v of variants as any[]) {
        // Prefer explicit option_values JSON when present
        let parsed = tryParseMeta(String(v.value || ''));
        if (!parsed || (Array.isArray(parsed) && parsed.length === 0)) parsed = tryParseMeta(String(v.name || ''));
        const opts: Array<{ name: string; value: string }> = Array.isArray(parsed?.option_values) ? parsed.option_values : (Array.isArray(parsed) ? parsed : []);
        for (const o of opts) {
            const n = String(o?.name || '').toLowerCase();
            const val = String(o?.value || '').trim();
            if (!val) continue;
            if (n === 'color' || /لون/i.test(n)) colorSet.add(val);
            else if (n === 'size' || /size|مقاس/i.test(n)) {
                const [label, only] = val.includes(':') ? val.split(':', 2) as [string, string] : ['المقاس', val];
                if (!sizeGroups.has(label)) sizeGroups.set(label, new Set());
                sizeGroups.get(label)!.add(only);
            }
        }
        // Fallbacks: derive from fields and tokens when JSON not available
        const nameStr = String((v as any).name || '');
        const valueStr = String((v as any).value || '');
        const tokens = splitTokens(`${nameStr} ${valueStr}`);
        for (const t of tokens) { if (isColorWord(t)) colorSet.add(t); }
        const explicitColor = (v as any).color; if (explicitColor) colorSet.add(String(explicitColor));
        const explicitSize = (v as any).size; if (explicitSize) {
            const [label, only] = String(explicitSize).includes(':') ? String(explicitSize).split(':', 2) as [string, string] : ['المقاس', String(explicitSize)];
            if (!sizeGroups.has(label)) sizeGroups.set(label, new Set());
            sizeGroups.get(label)!.add(only);
        }
        // As a last-resort fallback, only add generic 'المقاس' tokens when we still have no structured size groups
        if (sizeGroups.size === 0) {
            for (const t of tokens) {
                if (looksSizeToken(t) && !isColorWord(t)) {
                    if (!sizeGroups.has('المقاس')) sizeGroups.set('المقاس', new Set());
                    sizeGroups.get('المقاس')!.add(t);
                }
            }
        }
    }

    // Prepare final size groups for rendering: if we have labeled groups, hide the generic 'المقاس' row
    const sizeEntriesAll = Array.from(sizeGroups.entries());
    const hasLabeledSizes = sizeEntriesAll.some(([label]) => label !== 'المقاس');
    const sizeEntries = hasLabeledSizes ? sizeEntriesAll.filter(([label]) => label !== 'المقاس') : sizeEntriesAll;

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
                <div>
                    <div className="relative w-full aspect-square bg-gray-100 rounded">
                        <Image
                            src={images[activeIdx]}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                            sizes="(max-width:768px) 100vw, 50vw"
                        />
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                        {images.slice(0, 5).map((img: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                className={`relative w-full aspect-square rounded overflow-hidden border ${i === activeIdx ? 'border-black' : 'border-transparent'}`}
                                aria-label={`thumbnail-${i}`}
                            >
                                <img src={img} alt={`${product.name}-${i}`} className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                    <div className="text-[#800020] text-xl md:text-2xl font-semibold mt-3">${product.price}</div>
                    {clubMeta?.enabled && clubMeta?.placement?.pdp?.enabled && (
                        <a href={clubMeta?.joinUrl || '/register?club=1'} className={`mt-2 flex items-center justify-between px-3 py-2.5 rounded ${themeClass(clubMeta?.style?.theme)} transition-colors`}>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: themeBg(clubMeta?.style?.theme) }}>S</div>
                                <span className="text-sm">{clubMeta?.text}</span>
                            </div>
                            <span className="text-xs opacity-70">انضم الآن</span>
                        </a>
                    )}
                    <div className="mt-2">
                        {product.stockQuantity > 0 ? (
                            <span className="inline-flex items-center text-xs px-2 py-1 rounded-full border border-green-600 text-green-700">متوفر • {product.stockQuantity}</span>
                        ) : (
                            <span className="inline-flex items-center text-xs px-2 py-1 rounded-full border border-red-600 text-red-700">غير متوفر</span>
                        )}
                    </div>
                    {/* Tabs */}
                    <div className="mt-5 border-b flex items-center gap-6 text-sm">
                        <button className={`pb-2 ${tab === 'desc' ? 'border-b-2 border-[#800020] text-[#800020]' : ''}`} onClick={() => setTab('desc')}>{t('description')}</button>
                        <button className={`pb-2 ${tab === 'specs' ? 'border-b-2 border-[#800020] text-[#800020]' : ''}`} onClick={() => setTab('specs')}>{t('specs')}</button>
                        <button className={`pb-2 ${tab === 'reviews' ? 'border-b-2 border-[#800020] text-[#800020]' : ''}`} onClick={() => setTab('reviews')}>{t('reviews')}</button>
                    </div>
                    {tab === 'desc' && (
                        <p className="text-gray-700 mt-4 leading-relaxed">{product.description}</p>
                    )}
                    {tab === 'specs' && (
                        <div className="mt-4">
                            {/* Color selector */}
                            {colorSet.size > 0 && (
                                <div className="mb-4">
                                    <div className="text-sm text-gray-600 mb-2">اللون</div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(colorSet).map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setSelectedColor(prev => prev === c ? null : c)}
                                                className={`px-3 py-1.5 border rounded ${selectedColor === c ? 'border-black bg-black text-white' : 'bg-white'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Multiple size-type selectors (skip duplicate of the simple sizeOptions block) */}
                            {sizeEntries.map(([label, set]) => (
                                <div key={label} className="mb-4">
                                    <div className="text-sm text-gray-600 mb-2">{label}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(set).map((raw) => {
                                            const parts = String(raw || '').split('|').map(x => x.trim()).filter(Boolean);
                                            const pick = parts.find(x => looksSizeToken(x) && !isColorWord(x)) || parts[0] || String(raw || '');
                                            const s = pick;
                                            return (
                                                <button
                                                    key={String(raw)}
                                                    onClick={() => setSelectedSizes(prev => ({ ...prev, [label]: prev[label] === s ? '' : s }))}
                                                    className={`px-3 py-1.5 border rounded ${selectedSizes[label] === s ? 'border-black bg-black text-white' : 'bg-white'}`}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {/* Specs removed as property does not exist */}
                        </div>
                    )}
                    {tab === 'reviews' && (
                        <div className="mt-4">
                            {/* Rating summary */}
                            <div className="text-sm text-gray-700 mb-3">التقييم العام: {(() => {
                                const reviews = (product.reviews as any[]) || [];
                                const count = reviews.length;
                                const avg = count ? (reviews.reduce((a, b) => a + (b.rating || 0), 0) / count).toFixed(1) : 0;
                                return `${avg} (${count} تقييم)`;
                            })()}</div>
                            {(() => {
                                const rows = (product.reviews || []).filter((r: any) => r.isApproved !== false);
                                const total = rows.length || 1;
                                const counts = [1, 2, 3, 4, 5].reduce((acc: number[], n) => { acc[n] = rows.filter((r: any) => r.rating === n).length; return acc; }, [] as any);
                                return (
                                    <div className="mb-4 space-y-1">
                                        {[5, 4, 3, 2, 1].map((n) => {
                                            const c = counts[n] || 0;
                                            const pct = Math.round((c / total) * 100);
                                            return (
                                                <div key={n} className="flex items-center gap-2 text-xs">
                                                    <span className="w-10">{n}⭐</span>
                                                    <div className="flex-1 h-2 bg-gray-200 rounded">
                                                        <div className="h-2 bg-[#800020] rounded" style={{ width: pct + "%" }} />
                                                    </div>
                                                    <span className="w-10 text-right">{c}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                            {/* Filters & sort */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                    <button onClick={() => setReviewStarFilter(null)} className={`px-3 py-1.5 rounded-full border ${reviewStarFilter == null ? 'border-[#800020] text-[#800020]' : 'border-gray-200 text-gray-800'}`}>الكل</button>
                                    {[5, 4, 3, 2, 1].map(n => (
                                        <button key={n} onClick={() => setReviewStarFilter(n)} className={`px-3 py-1.5 rounded-full border ${reviewStarFilter === n ? 'border-[#800020] text-[#800020]' : 'border-gray-200 text-gray-800'}`}>{n}⭐</button>
                                    ))}
                                </div>
                                <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value as any)} className="px-3 py-1.5 rounded-full border border-gray-200 text-sm">
                                    <option value="newest">الأحدث</option>
                                    <option value="highest">الأعلى تقييماً</option>
                                    <option value="lowest">الأدنى تقييماً</option>
                                </select>
                            </div>
                            <ul className="space-y-3">
                                {(() => {
                                    let list = (product.reviews || []).filter((r: any) => r.isApproved !== false);
                                    if (reviewStarFilter) list = list.filter((r: any) => r.rating === reviewStarFilter);
                                    if (reviewSort === 'newest') list = list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                    if (reviewSort === 'highest') list = list.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
                                    if (reviewSort === 'lowest') list = list.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
                                    return list.slice(0, 20).map((r: any) => (
                                        <li key={r.id} className="border rounded p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-sm font-semibold">{r.user?.name || 'مستخدم'}</div>
                                                <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('ar')}</div>
                                            </div>
                                            <div className="text-[#800020] text-sm">{'⭐'.repeat(Math.max(1, Math.min(5, r.rating || 0)))}</div>
                                            {r.comment && <p className="mt-1 text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
                                        </li>
                                    ));
                                })()}
                            </ul>
                            {/* Add review */}
                            <div className="mt-4 border-t pt-4">
                                {!isAuth ? (
                                    <div className="text-sm text-gray-600">سجّل الدخول لإضافة تقييم.</div>
                                ) : (
                                    <form
                                        className="space-y-2"
                                        onSubmit={async (e) => { e.preventDefault(); try { await createReview.mutateAsync({ productId: product.id, rating, comment }); setComment(''); } catch { } }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button type="button" key={n} onClick={() => setRating(n)} aria-label={`rate-${n}`}>{n <= rating ? '⭐' : '☆'}</button>
                                            ))}
                                        </div>
                                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تعليقك" className="w-full border rounded px-3 py-2 min-h-[84px]" />
                                        <button type="submit" className="px-4 py-2 bg-[#800020] text-white rounded">إرسال التقييم</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex items-center border rounded">
                            <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="decrease">-</button>
                            <div className="px-4 py-2 min-w-[48px] text-center select-none">{qty}</div>
                            <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)} aria-label="increase">+</button>
                        </div>
                        <button
                            disabled={product.stockQuantity <= 0 || addItem.isLoading}
                            onClick={async () => {
                                await addItem.mutateAsync({ productId: product.id, quantity: qty });
                                window.location.href = '/cart';
                            }}
                            className="px-5 py-3 bg-[#800020] text-white rounded disabled:opacity-50"
                        >
                            {t('addToCart')}
                        </button>
                        <button
                            className="px-4 py-3 border rounded"
                            onClick={() => window.location.href = `/wishlist`}
                        >
                            إضافة للمفضلة
                        </button>
                    </div>
                    {/* Accordions: Shipping & Returns */}
                    <div className="mt-6 space-y-2">
                        <div className="border rounded">
                            <button className="w-full flex items-center justify-between px-3 py-2 text-sm" onClick={() => setShowShip((v) => !v)}>
                                <span>{t('shipping')}</span>
                                <span>{showShip ? '−' : '+'}</span>
                            </button>
                            {showShip && (
                                <div className="px-3 pb-3 text-sm text-gray-600">شحن خلال 2-5 أيام عمل. تتبع فوري عند الشحن.</div>
                            )}
                        </div>
                        <div className="border rounded">
                            <button className="w-full flex items-center justify-between px-3 py-2 text-sm" onClick={() => setShowReturn((v) => !v)}>
                                <span>{t('returns')}</span>
                                <span>{showReturn ? '−' : '+'}</span>
                            </button>
                            {showReturn && (
                                <div className="px-3 pb-3 text-sm text-gray-600">إرجاع خلال 15 يومًا وفق الشروط.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Sticky ATC on mobile */}
            <div className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white p-3 flex items-center justify-between z-40">
                <div className="text-sm font-semibold text-[#800020]">${product.price}</div>
                <button
                    className="px-4 py-2 bg-[#800020] text-white rounded"
                    onClick={async () => { await addItem.mutateAsync({ productId: product.id, quantity: 1 }); window.location.href = '/cart'; }}
                >
                    {t('addToCart')}
                </button>
            </div>
            {/* Recommended products */}
            <section className="mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4">منتجات مقترحة</h2>
                {/* Fallback to latest list; ideally filter by same category */}
                <RecommendedGrid />
            </section>
        </main>
    );
}

function RecommendedGrid(): JSX.Element {
    const { data } = trpc.products.list.useQuery({ limit: 10 });
    const items = data?.items ?? [];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((p: any) => (
                <ProductCard
                    key={p.id}
                    product={{
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        images: p.images,
                        stock: p.stockQuantity,
                        rating: (p.reviews && p.reviews.length) ? (p.reviews.reduce((a: any, b: any) => a + (b.rating || 0), 0) / p.reviews.length) : 0,
                        reviewCount: p.reviews?.length || 0
                    }}
                    onViewDetails={(id) => (window.location.href = `/p/${(p as any).slug || id}`)}
                />
            ))}
        </div>
    );
}
