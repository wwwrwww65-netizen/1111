<template>
  <div class="bg-[#f7f7f7] pb-24" dir="rtl">
    <!-- Header - Dynamic with Search Bar on Scroll -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-white">
      <!-- Main Header -->
      <div 
        class="flex items-center justify-between px-4 py-3 border-b transition-all duration-300"
        :class="showHeaderSearch ? 'shadow-sm' : 'border-gray-200'"
      >
        <!-- Right Side - Back Button & Menu -->
        <div class="flex items-center gap-1">
          <button class="bg-transparent border-0" @click="router.back()" aria-label="رجوع">
            <ChevronRight :size="28" />
          </button>
          <button class="bg-transparent border-0" aria-label="القائمة">
            <Menu :size="24" />
          </button>
        </div>

        <!-- Center - Logo or Search Bar -->
        <div class="flex-1 flex items-center justify-center px-2">
          <!-- Search Bar (shows when scrolled) -->
          <Transition name="fade" mode="out-in">
            <div v-if="showHeaderSearch" key="search" class="w-full max-w-lg">
              <div class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full mx-2">
                <input 
                  type="text" 
                  placeholder="بلايز نسائي" 
                  class="flex-1 bg-transparent border-0 outline-none text-[13px] text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            <!-- Logo (default) -->
            <div 
              v-else
              key="logo"
              class="text-[20px] font-extrabold"
              style="color: #8a1538"
            >
              جي jeeey
            </div>
          </Transition>
        </div>

        <!-- Left Side -->
      <div class="flex items-center gap-3">
          <button class="bg-transparent border-0" @click="share" aria-label="مشاركة">
            <Share :size="24" />
          </button>
          <div class="relative inline-flex cursor-pointer" @click="router.push('/cart')" aria-label="السلة">
          <ShoppingCart :size="24" />
          <span v-if="cart.count" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[11px] px-1 border border-white">{{ cart.count }}</span>
        </div>
      </div>
      </div>

      <!-- Dynamic Header Content: Price / Tabs / Recommendation Strip -->
      <div class="relative">
        <!-- State 1: Price Only (before tabs sticky) -->
        <Transition name="slide-down">
          <div 
            v-if="showHeaderPrice && !tabsSticky && !showRecommendationStrip" 
            class="px-4 py-2 bg-white border-b border-gray-200 shadow-sm"
          >
            <div class="text-[18px] font-extrabold text-black">{{ displayPrice }}</div>
          </div>
        </Transition>

        <!-- State 2: Tabs (sticky, with optional price) -->
        <Transition name="slide-down">
          <div 
            v-if="!showRecommendationStrip && tabsSticky"
            ref="tabsRef"
            class="bg-white border-b border-gray-200 relative z-40"
          >
            <div class="flex border-b border-gray-200">
              <button 
                v-for="tab in tabs" 
                :key="tab.key"
                class="flex-1 py-3 text-[15px] border-b-2 transition-colors duration-200"
                :class="activeTab === tab.key ? 'font-bold text-black' : 'border-transparent text-gray-400'"
                :style="activeTab === tab.key ? 'border-bottom-color: #8a1538' : ''"
                @click="scrollToSection(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>
            <Transition name="fade">
              <div v-if="showHeaderPrice" class="px-4 py-2 border-b border-gray-200">
                <div class="text-[18px] font-extrabold text-black">{{ displayPrice }}</div>
              </div>
            </Transition>
          </div>
        </Transition>

        <!-- State 3: Recommendation Strip -->
        <Transition name="slide-down">
          <div 
            v-if="showRecommendationStrip"
            class="bg-white border-b border-gray-200 relative z-40"
          >
            <div class="flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
              <button class="pb-1 text-[14px] border-b-2 font-bold whitespace-nowrap text-black" style="border-bottom-color: #8a1538">
                التوصية
              </button>
              <button class="pb-1 text-[14px] border-b-2 border-transparent text-gray-600 whitespace-nowrap">
                مجوهرات & ساعات
              </button>
              <button class="pb-1 text-[14px] border-b-2 border-transparent text-gray-600 whitespace-nowrap">
                ملابس واكسسوارات
              </button>
              <button class="pb-1 text-[14px] border-b-2 border-transparent text-gray-600 whitespace-nowrap">
                ملابس داخلية & ملابس نوم
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- White Container: Gallery to Size Guide -->
    <div class="bg-white" :style="{ marginTop: (showRecommendationStrip ? '106px' : (tabsSticky ? (showHeaderPrice ? '149px' : '106px') : '57px')) }">
      <!-- Product Image Gallery -->
    <div class="relative">
        <div ref="galleryRef" class="w-full overflow-x-auto snap-x snap-mandatory no-scrollbar bg-black"
           :style="{ height: galleryHeight ? (galleryHeight + 'px') : undefined }"
           @scroll.passive="onGalleryScroll">
          <div class="flex h-full">
            <div v-for="(img,idx) in images" :key="'hero-'+idx" class="w-full h-full flex-shrink-0 snap-start relative flex items-center justify-center" style="min-width:100%">
              <img :src="img" :alt="title" class="w-full h-full block" :class="getImgFitClass(idx)" loading="lazy" decoding="async" :fetchpriority="idx===0 ? 'high' : 'low'" sizes="100vw" @click="openLightbox(idx)" />
        </div>
      </div>
      </div>

        <!-- Pages indicator -->
        <div class="carousels-pagination__pages">
          {{ images.length }}/{{ activeIdx+1 }}
      </div>
    </div>

    <!-- Lightbox fullscreen -->
    <div v-if="lightbox" class="fixed inset-0 bg-black/95 z-50 flex flex-col" @keydown.esc="closeLightbox" tabindex="0">
      <div class="flex justify-between items-center p-3 text-white">
        <button class="px-3 py-1 rounded border border-white/30" @click="closeLightbox">إغلاق</button>
        <div class="text-[13px]">{{ lightboxIdx+1 }} / {{ images.length }}</div>
      </div>
      <div class="flex-1 relative">
        <div ref="lightboxRef" class="w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
          <div class="flex h-full">
            <img v-for="(img,i) in images" :key="'lb-'+i" :src="img" class="w-full h-full object-contain flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" decoding="async" sizes="100vw" />
          </div>
        </div>
        <button class="absolute left-2 top-1/2 -translate-y-1/2 text-white text-2xl" @click="prevLightbox" aria-label="السابق">‹</button>
        <button class="absolute right-2 top-1/2 -translate-y-1/2 text-white text-2xl" @click="nextLightbox" aria-label="التالي">›</button>
      </div>
      <div class="p-2 flex justify-center gap-1">
        <span v-for="(img,i) in images" :key="'lbdot-'+i" class="w-1.5 h-1.5 rounded-full" :class="i===lightboxIdx? 'bg-white' : 'bg-white/40'" />
      </div>
    </div>

    <!-- Trending Badge (dynamic) -->
    <div class="flex items-center justify-between px-4 py-2 bg-purple-50" v-if="pdpMeta.badges && pdpMeta.badges.length">
      <span class="text-[14px] font-bold text-purple-700">{{ pdpMeta.badges[0]?.title || '' }}</span>
      <span class="text-[13px] text-gray-600">{{ pdpMeta.badges[0]?.subtitle || '' }}</span>
      </div>

    <!-- Price Section -->
    <div ref="priceRef" class="px-4 py-4">
      <div class="text-[22px] font-extrabold text-black">{{ displayPrice }}</div>
    </div>

    <!-- Jeeey Club Bar (dynamic) -->
    <div v-if="pdpMeta.clubBanner && pdpMeta.clubBanner.enabled && pdpMeta.clubBanner.placement?.pdp?.enabled"
      class="mx-4 mb-4 flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors"
      :class="clubThemeClass"
      role="button"
      @click="goTo(pdpMeta.clubBanner.joinUrl||'/register?club=1')">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full flex items-center justify-center" :style="clubAvatarStyle">
            <span class="text-white text-[11px] font-bold">S</span>
          </div>
          <span class="text-[13px]" :class="clubTextClass">{{ pdpMeta.clubBanner.text }}</span>
        </div>
        <ChevronLeft :size="16" class="text-gray-600" />
    </div>

    <!-- Product Info -->
    <div class="px-4">
      <div class="flex items-center justify-between mb-2">
        <div v-if="reviews.length" class="flex items-center gap-1">
          <StarIcon :size="14" class="text-yellow-400 fill-yellow-400" />
          <span class="font-bold text-[14px]">{{ avgRating.toFixed(1) }}</span>
          <span class="text-gray-600 text-[13px]">(+{{ reviews.length }})</span>
        </div>
        <h1 class="text-[13px] leading-relaxed text-gray-800 text-right">
          {{ title }}
        </h1>
      </div>

      <div class="mb-1">
        <span v-for="(b,i) in (pdpMeta.badges||[])" :key="'bdg-top-'+i" class="inline-flex items-center px-2 py-0.5 text-white text-[11px] font-bold rounded" :style="b.bgColor ? ('background-color:'+b.bgColor) : 'background-color:#8a1538'">{{ b.title }}</span>
      </div>

      <!-- Best-seller Strip (club style) -->
      <div v-if="pdpMeta.bestRank" class="mb-4 flex items-center justify-between px-3 py-2.5 rounded-md" :class="clubThemeClass">
        <!-- Left side: thumbnails + arrow (far left) -->
        <div class="flex items-center gap-2">
          <ChevronLeft :size="16" class="text-gray-600" />
          <div class="flex -space-x-2">
            <div v-for="i in 3" :key="'thumb-'+i" class="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
              <img :src="imageAt(i)" class="w-full h-full object-cover" loading="lazy" decoding="async" sizes="64px" />
            </div>
          </div>
        </div>
        <!-- Right side: best seller badge + category -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center h-[20px] px-1.5 text-[11px] font-semibold rounded" style="background:rgb(255,232,174); color:#c77210">#{{ pdpMeta.bestRank }} الأفضل مبيعاً</span>
          <span class="text-[12px]" :class="clubTextClass">في {{ categoryName || 'هذه الفئة' }}</span>
        </div>
      </div>

      <!-- Color Selector -->
      <div class="mb-4" v-if="colorVariants.length">
        <div class="flex items-center gap-1 mb-2">
          <span class="font-semibold text-[14px]">لون: {{ currentColorName || '—' }}</span>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>
        <div class="flex gap-1 overflow-x-auto no-scrollbar pb-2">
          <div v-for="(c,i) in colorVariants" :key="'color-'+i" class="flex-shrink-0 relative" data-testid="color-swatch" :data-color="c.name">
            <div class="w-[50px] h-[70px] rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-105" :class="i===colorIdx ? '' : 'border-gray-200'" :style="i===colorIdx ? 'border-color: #8a1538' : ''" @click="colorIdx=i" :aria-selected="i===colorIdx">
              <img :src="c.image" class="w-full h-full object-cover" :alt="c.name" />
            </div>
            <div v-if="c.isHot" class="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
              HOT
            </div>
            <div v-if="i===colorIdx" class="absolute bottom-0 left-0 right-0 h-0.5" style="background-color: #8a1538"></div>
          </div>
        </div>
      </div>

      <!-- Size Selector (single list) - hidden until attributes loaded to avoid flicker, and hidden when multi size-groups exist) -->
      <div ref="sizeSelectorRef" class="mb-4" v-if="attrsLoaded && sizeOptions.length && !sizeGroups.length">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-[14px]">مقاس - {{ size || 'اختر المقاس' }}</span>
          <span class="text-[13px] text-gray-600 cursor-pointer" @click="openSizeGuide">مرجع المقاس ◀</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="s in sizeOptions" 
            :key="s" 
            class="px-4 py-2 border rounded-full text-[13px] font-medium transition-all hover:scale-105"
            :class="size===s ? 'text-white' : 'bg-white text-black border-gray-300'"
            :style="size===s ? 'background-color: #8a1538; border-color: #8a1538' : ''"
            data-testid="size-btn" :data-size="s"
            @click="size=s"
          >
            {{ s }}
          </button>
        </div>
      <div class="mt-2">
          <span class="text-[13px] text-gray-600 underline cursor-pointer">ترام كيرفي ◀</span>
      </div>
      </div>

      <!-- Multi size-type selectors (letters/numbers etc.) - rendered independently when available -->
      <div v-if="sizeGroups.length" class="mb-4 space-y-3">
        <div v-for="(g,gi) in sizeGroups" :key="'g-'+gi">
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-[14px]">{{ g.label }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="s in g.values" 
              :key="g.label+'-'+s" 
              class="px-4 py-2 border rounded-full text-[13px] font-medium transition-all hover:scale-105"
              :class="selectedGroupValues[g.label]===s ? 'text-white' : 'bg-white text-black border-gray-300'"
              :style="selectedGroupValues[g.label]===s ? 'background-color: #8a1538; border-color: #8a1538' : ''"
              @click="onPickGroupValue(g.label, s)"
              data-testid="size-btn"
            >
              {{ displayGroupValue(s) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Fit Rating (show only if product has sizes) -->
      <div v-if="(sizeOptions.length || sizeGroups.length)" class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors">
        <div v-if="reviews.length && (pdpMeta.fitPercent!=null || pdpMeta.fitText)" class="flex items-center gap-2 mb-2">
          <ThumbsUp :size="16" class="text-green-600" />
          <span class="font-bold text-[16px]">{{ pdpMeta.fitPercent ?? 0 }}%</span>
          <span class="text-[13px] text-gray-700">{{ pdpMeta.fitText || 'يعتقد من العملاء أن المقاس حقيقي ومناسب' }}</span>
          <ChevronLeft :size="16" class="text-gray-600 mr-auto" />
        </div>
        <button class="w-full text-start text-[14px] text-gray-800 underline font-medium" @click="openFitModal">ليس مقاسك؟ أخبرنا ما هو مقاسك ◀</button>
      </div>
    </div>
    <div ref="firstContainerEnd"></div>
    </div>

    <!-- White Container: Shipping Info -->
    <div class="bg-white px-4 mt-0.5">
      <!-- Shipping to destination -->
      <div class="mb-4">
        <div class="text-[16px] font-bold mb-3">الشحن إلى {{ destinationText }}</div>
        
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div class="flex items-center gap-2" @click="openShippingDetails" role="button">
            <Truck :size="20" class="text-green-600" />
            <div>
              <div class="text-[14px] font-bold">{{ shippingTitleText }}</div>
              <div class="text-[13px] text-gray-600">{{ shippingEtaText }}</div>
            </div>
          </div>
          <ChevronLeft :size="16" class="text-gray-600" />
      </div>

        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <span class="text-white text-[11px] font-bold">S</span>
          </div>
            <div class="text-[13px]">
              انضم للحصول على X15 كوبونات شحن (بقيمة 450.00#)
        </div>
        </div>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>

        <div class="flex items-center justify-between py-3 border-b border-gray-200" @click="openPolicy('cod')" role="button">
          <div class="flex items-center gap-2">
            <DollarSign :size="20" class="text-green-600" />
            <span class="text-[14px]">خدمة الدفع عند الاستلام</span>
          </div>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>

        <div class="flex items-center justify-between py-3 border-b border-gray-200" @click="openPolicy('returns')" role="button">
          <div class="flex items-center gap-2">
            <RotateCcw :size="20" class="text-gray-600" />
            <span class="text-[14px]">سياسة الإرجاع</span>
          </div>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>

        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <ShieldCheck :size="20" class="text-green-600" />
            <span class="text-[14px]">أمن التسوق</span>
          </div>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>

        <div class="mt-3 p-3 bg-gray-50 rounded-lg" @click="openPolicy('secure')" role="button">
          <div class="grid grid-cols-2 gap-2 text-[12px] text-gray-700">
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>طرق دفع آمنة</div>
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>شحن آمن</div>
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>حماية الخصوصية</div>
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>خدمة العملاء</div>
          </div>
      </div>

        <!-- Removed seller/shipping source row as requested -->
        </div>
      </div>

    <!-- White Container: Products Section -->
    <div class="bg-white px-4 mt-0.5">
      <!-- Section 1: Products (Always Visible) -->
      <div ref="productsContentRef">
        <!-- Coupon Banner -->
        <div v-if="(pdpMeta as any)?.occasionStrip?.enabled" class="mb-4 p-3 rounded-lg border" :style="`background-image: linear-gradient(to right, ${(pdpMeta as any)?.occasionStrip?.theme?.gradientFrom||'#fdf2f8'}, ${(pdpMeta as any)?.occasionStrip?.theme?.gradientTo||'#fffbeb'}); border-color: ${(pdpMeta as any)?.occasionStrip?.theme?.borderColor||'#fbcfe8'}`">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-semibold">{{ (pdpMeta as any).occasionStrip.title }}</span>
              <span v-if="(pdpMeta as any).occasionStrip.kpiText" class="text-[11px] text-green-700 font-bold">{{ (pdpMeta as any).occasionStrip.kpiText }}</span>
            </div>
            <a v-if="(pdpMeta as any).occasionStrip.cta?.label && (pdpMeta as any).occasionStrip.cta?.url" :href="(pdpMeta as any).occasionStrip.cta.url" class="text-[12px] underline">{{ (pdpMeta as any).occasionStrip.cta.label }}</a>
          </div>
          <div v-if="(pdpMeta as any).occasionStrip.subtitle" class="text-[12px] text-gray-700 mt-1">
            {{ (pdpMeta as any).occasionStrip.subtitle }}
          </div>
        </div>

        <!-- Description trigger (opens modal) -->
        <div class="mb-4 pb-2 border-b border-gray-200">
          <button class="w-full flex items-center justify-between py-1" @click="descOpen=true">
            <span class="font-semibold text-[15px]">وصف</span>
            <ChevronLeft :size="16" class="text-gray-600" />
          </button>
        </div>

      <!-- Model Measurements (dynamic from PDP meta: modelEnabled + fields[]) -->
      <div v-if="(pdpMeta as any)?.modelEnabled" class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[14px] font-bold mb-2">عارضة الأزياء</div>
            <div class="text-[12px] text-gray-600">
              <template v-if="Array.isArray((pdpMeta as any)?.model?.fields) && (pdpMeta as any)?.model?.fields.length">
                <template v-for="(f,idx) in (pdpMeta as any).model.fields" :key="'mf-'+idx">
                  <span>{{ f.label }}: {{ f.value }}</span>
                  <span v-if="idx < ((pdpMeta as any).model.fields.length-1)"> | </span>
                </template>
              </template>
              <template v-else>
                <span>—</span>
              </template>
            </div>
          </div>
          <div class="w-12 h-12 rounded-full overflow-hidden" v-if="(pdpMeta as any)?.model?.imageUrl">
            <img :src="(pdpMeta as any).model.imageUrl" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

        <!-- Vendor Store Info (hidden by default; enable via pdpMeta.vendorBoxEnabled) -->
        <div v-if="(pdpMeta as any)?.vendorBoxEnabled && seller" class="mb-4 p-4 border border-gray-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="font-bold text-[15px]">{{ seller.storeName || seller.name || brand || '—' }}</span>
              <ChevronLeft :size="16" class="text-gray-600" />
            </div>
            <div class="w-14 h-14 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center">
              <img v-if="seller.meta?.logoUrl" :src="seller.meta.logoUrl" alt="logo" class="w-full h-full object-cover" />
              <span v-else class="text-2xl">{{ (seller.storeName||seller.name||'J').charAt(0) }}</span>
            </div>
          </div>
          <div v-if="seller.meta?.bannerUrl" class="mb-2 rounded overflow-hidden">
            <img :src="seller.meta.bannerUrl" alt="banner" class="w-full h-16 object-cover rounded" />
          </div>
          <div class="text-[12px] text-gray-700 mb-2">
            {{ seller.meta?.blurb || '' }}
          </div>
          <div class="text-[11px] text-gray-600 mb-3">{{ sellerFollowText }}</div>
          <div class="flex gap-2 mb-3" v-if="pdpMeta.badges && pdpMeta.badges.length">
            <span v-for="(b,i) in (pdpMeta.badges||[])" :key="'bdg-seller-'+i" class="inline-flex items-center px-2 py-0.5 text-white text-[11px] font-bold rounded" :style="b.bgColor ? ('background-color:'+b.bgColor) : 'background-color:#8a1538'">{{ b.title }}</span>
          </div>
          <div class="flex items-center gap-3 mb-3" v-if="seller.meta?.links">
            <a v-if="seller.meta.links.website" class="text-[12px] underline text-blue-600" :href="seller.meta.links.website" target="_blank" rel="noopener">الموقع</a>
            <a v-if="seller.meta.links.instagram" class="text-[12px] underline text-pink-600" :href="seller.meta.links.instagram" target="_blank" rel="noopener">انستغرام</a>
            <a v-if="seller.meta.links.whatsapp" class="text-[12px] underline text-green-600" :href="('https://wa.me/'+seller.meta.links.whatsapp.replace(/[^\d]/g,''))" target="_blank" rel="noopener">واتساب</a>
          </div>
          <div class="flex gap-2">
            <button class="flex-1 py-2 border border-gray-300 rounded-full text-[13px]" @click="goTo('/store/'+(seller.id||''))">كل المنتجات</button>
            <button class="flex-1 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full text-[13px] font-bold">+ متابع</button>
          </div>
        </div>
      </div>
      </div>

    <!-- White Container: Reviews Section -->
    <div class="bg-white px-4 mt-0.5" v-if="reviews.length">
      <!-- Section 2: Reviews (Always Visible) -->
      <div ref="reviewsContentRef" class="mt-8">
        <!-- Reviews Header -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <span class="font-bold text-[16px]">تعليقات(+1000)</span>
            <span class="text-[13px] text-gray-600 cursor-pointer">عرض الكل ◀</span>
      </div>

          <!-- Overall Rating + 3 progress bars (Small / True / Large) -->
          <div v-if="reviews.length" class="mb-4">
            <div class="text-center mb-4">
              <div class="flex justify-center mb-2">
                <StarIcon v-for="i in 5" :key="i" :size="20" class="text-yellow-400 fill-yellow-400" />
              </div>
              <div class="text-[32px] font-bold">{{ avgRating.toFixed(2) }}</div>
            </div>
            <div class="grid grid-cols-3 gap-2 items-end">
              <div class="flex flex-col gap-1 items-start">
                <span class="text-[12px] text-gray-600">صغير</span>
                <div class="w-full h-2 bg-gray-200 rounded overflow-hidden" style="min-width:80px">
                  <div class="h-full" :style="barStyle(fitSmallPct)"></div>
                </div>
                <span class="text-[11px] text-gray-600">{{ fitSmallPct }}%</span>
              </div>
              <div class="flex flex-col gap-1 items-center">
                <span class="text-[12px] text-gray-600">مناسب</span>
                <div class="w-full h-2 bg-gray-200 rounded overflow-hidden" style="min-width:80px">
                  <div class="h-full" :style="barStyle(fitTruePct)"></div>
                </div>
                <span class="text-[11px] text-gray-600">{{ fitTruePct }}%</span>
              </div>
              <div class="flex flex-col gap-1 items-end">
                <span class="text-[12px] text-gray-600">كبير</span>
                <div class="w-full h-2 bg-gray-200 rounded overflow-hidden" style="min-width:80px">
                  <div class="h-full" :style="barStyle(fitLargePct)"></div>
                </div>
                <span class="text-[11px] text-gray-600">{{ fitLargePct }}%</span>
              </div>
            </div>
          </div>

          <!-- Fit Survey -->
          <div class="mb-4">
            <div class="text-[13px] text-gray-700 mb-2">هل مقاس المنتج مناسب بشكل جيد؟</div>
            <div class="flex items-center justify-between text-[12px] mb-1">
              <span class="text-gray-600">صغير</span>
              <span class="font-bold">مناسب</span>
              <span class="text-gray-600">كبير</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-gray-600 text-[12px]">2%</span>
              <div class="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                <div class="h-full bg-black rounded" style="width: 96%"></div>
              </div>
              <span class="text-gray-600 text-[12px]">2%</span>
            </div>
            <div class="flex justify-between text-[12px] text-gray-600 mt-1">
              <span>صغير</span>
              <span class="font-bold text-black">96%</span>
              <span>مناسب</span>
              <span>2%</span>
              <span>كبير</span>
            </div>
          </div>

          <!-- Review Filters -->
          <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
            <button class="px-3 py-1.5 bg-gray-100 rounded-full text-[12px] whitespace-nowrap">
              سوف اشتريه مرة أخرى (7)
          </button>
            <button class="px-3 py-1.5 bg-gray-100 rounded-full text-[12px] whitespace-nowrap">
              قماش جيد (+100)
            </button>
            <button class="px-3 py-1.5 bg-gray-100 rounded-full text-[12px] whitespace-nowrap">
              أنيق (+100)
            </button>
          </div>

          <!-- Local Reviews Badge -->
          <div class="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
            <div class="flex">
              <StarIcon v-for="i in 5" :key="i" :size="16" class="text-yellow-400 fill-yellow-400" />
        </div>
            <span class="font-bold">{{ avgRating.toFixed(2) }}</span>
            <span class="text-[13px] text-gray-600">تقييمات العملاء المحلية</span>
            <ChevronLeft :size="16" class="text-gray-600 mr-auto" />
      </div>

          <!-- Individual Reviews -->
          <div v-for="review in customerReviews" :key="review.id" class="mb-4 pb-4 border-b border-gray-200">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-[14px]">{{ review.userName }}</span>
                  <div class="flex">
                    <StarIcon v-for="i in review.rating" :key="i" :size="14" class="text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div class="text-[12px] text-gray-600 mt-1">
                  لون:{{ review.color || 'أصفر' }} / مقاس:{{ review.size }}
                </div>
              </div>
              <span class="text-[12px] text-gray-400">{{ formatReviewDate(review.date) }}</span>
    </div>

            <div class="text-[13px] text-gray-800 mb-2 leading-relaxed">
              {{ review.text }}
              <span v-if="review.images && review.images.length" class="text-gray-600">... 🖼️ اكثر</span>
    </div>

            <!-- Review Images -->
            <div v-if="review.images && review.images.length" class="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              <div 
                v-for="(img, imgIdx) in review.images" 
                :key="imgIdx"
                class="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                @click="openReviewImage(img)"
              >
                <img :src="img" class="w-full h-full object-cover" />
        </div>
      </div>

            <!-- Helpful Button -->
            <div class="flex items-center gap-2">
              <button class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-[13px]">
                <ThumbsUp :size="14" />
                <span>مفيد ({{ review.helpful || 0 }})</span>
              </button>
              <button class="text-[13px] text-gray-600">...</button>
            </div>
          </div>
        </div>
      </div>
      </div>

    <!-- White Container: Recommendations Header -->
    <div class="bg-white px-4 mt-0.5">
      <!-- Section 3: Recommendations (Always Visible) -->
      <div ref="recommendationsContentRef" class="mt-8">
        <div class="text-[16px] font-bold mb-3">ربما يعجبك هذا أيضاً</div>
        
        <!-- Sub Tabs -->
        <div ref="recommendationTabsRef" class="flex gap-4 mb-4 overflow-x-auto no-scrollbar border-b border-gray-200">
          <button class="pb-2 text-[14px] border-b-2 font-bold whitespace-nowrap" style="border-bottom-color: #8a1538">
            التوصية
          </button>
          <button class="pb-2 text-[14px] border-b-2 border-transparent text-gray-600 whitespace-nowrap">
            مجوهرات & ساعات
          </button>
          <button class="pb-2 text-[14px] border-b-2 border-transparent text-gray-600 whitespace-nowrap">
            ملابس واكسسوارات
          </button>
          <button class="pb-2 text-[14px] border-b-2 border-transparent text-gray-600 whitespace-nowrap">
            ملابس داخلية & ملابس نوم
          </button>
        </div>
      </div>
    </div>

    <!-- Product Cards - NO container, just cards -->
    <div class="px-2 pb-2">
      <!-- Product Cards - same layout as Products.vue -->
        <div class="columns-2 gap-1 [column-fill:_balance] pb-2">
          <div v-for="(p,i) in recommendedProducts" :key="'rec-'+i" class="mb-1 break-inside-avoid">
            <div class="w-full border border-gray-200 rounded bg-white overflow-hidden cursor-pointer" role="button" :aria-label="'افتح '+(p.title||'المنتج')" tabindex="0" @click="openRecommended(p)" @keydown.enter="openRecommended(p)" @keydown.space.prevent="openRecommended(p)">
              <div class="relative w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                <div class="flex">
                  <img :src="p.image" :alt="p.title" class="w-full h-auto object-cover block flex-shrink-0 snap-start" style="min-width:100%" loading="lazy" decoding="async" sizes="(max-width:640px) 50vw, 33vw" />
                </div>
                <div v-if="p.colors && p.colors.length" class="absolute bottom-2 right-2 flex items-center">
                  <div class="flex flex-col items-center gap-0.5 bg-black/40 p-0.5 rounded-full">
                    <span v-for="(c,idx) in p.colors.slice(0,3)" :key="'clr-'+idx" class="w-3 h-3 rounded-full border border-white/20" :style="{ background: c }"></span>
                    <span v-if="p.colorCount" class="mt-0.5 text-[9px] font-semibold px-1 rounded-full text-white/80 bg-white/5">{{ p.colorCount }}</span>
                  </div>
                </div>
              </div>
              <div class="relative p-2">
                <div class="inline-flex items-center border border-gray-200 rounded overflow-hidden">
                  <span class="inline-flex items-center h-[18px] px-1.5 text-[11px] text-white bg-violet-700">ترندات</span>
                  <span class="inline-flex items-center h-[18px] px-1.5 text-[11px] bg-gray-100 text-violet-700">
                    <Store :size="14" color="#6D28D9" :stroke-width="2" />
                    <span class="max-w-[96px] overflow-hidden text-ellipsis whitespace-nowrap">{{ p.brand||'' }}</span>
                    <span class="text-violet-700 ms-0.5">&gt;</span>
                  </span>
                </div>
                <div class="flex items-center gap-1 mt-1.5">
                  <div v-if="p.discountPercent" class="px-1 h-4 rounded text-[11px] font-bold border border-orange-300 text-orange-500 flex items-center leading-none">-%{{ p.discountPercent }}</div>
                  <div class="text-[12px] text-gray-900 font-medium leading-tight truncate">{{ p.title }}</div>
                </div>
                <div v-if="p.bestRank" class="mt-1 inline-flex items-stretch rounded overflow-hidden">
                  <div class="px-1 text-[9px] font-semibold flex items-center leading-none bg-[rgb(255,232,174)] text-[#c77210]">#{{ p.bestRank }} الأفضل مبيعاً</div>
                </div>
                <div class="mt-1 flex items-center gap-1">
                  <span class="text-red-600 font-bold text-[13px]">{{ p.price }} ريال</span>
                  <span v-if="p.soldPlus" class="text-[11px] text-gray-700">{{ p.soldPlus }}</span>
                </div>
                <button class="absolute left-2 bottom-6 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black bg-white" aria-label="أضف إلى السلة" @click.stop="addToCart">
                  <ShoppingCart :size="16" class="text-black" />
                  <span class="text-[11px] font-bold text-black">1+</span>
                </button>
                <div v-if="p.couponPrice" class="mt-1 h-7 inline-flex items-center gap-1 px-2 rounded bg-[rgba(249,115,22,.10)]">
                  <span class="text-[13px] font-extrabold text-orange-500">{{ p.couponPrice }} ريال</span>
                  <span class="text-[11px] text-orange-500">/بعد الكوبون</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      <!-- Loading -->
      <div v-if="isLoadingRecommended" class="flex items-center justify-center py-8">
        <div class="flex flex-col items-center gap-2">
          <div class="w-8 h-8 border-4 border-gray-300 rounded-full animate-spin" style="border-top-color: #8a1538"></div>
          <span class="text-[12px] text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    </div>

    <!-- Back to Top Button -->
    <button 
      v-if="showBackToTop"
      @click="scrollToTop"
      class="fixed bottom-24 left-4 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-110 transition-all hover:shadow-xl"
      style="border-color: #8a1538"
    >
      <ChevronUp :size="24" style="color: #8a1538" />
    </button>

    <!-- Bottom Actions - Fixed with shadow on scroll -->
    <div 
      class="fixed left-0 right-0 bottom-0 bg-white border-t p-3 flex items-center gap-2 z-50 transition-all duration-300"
      :class="scrolled ? 'border-gray-200 shadow-lg' : 'border-gray-200'"
    >
      <button 
        class="flex-1 h-12 rounded-md text-white font-bold transition-all active:scale-95 hover:opacity-90"
        style="background-color: #8a1538"
        @click="addToCart"
      >
        أضف إلى عربة التسوق بنجاح
      </button>
      <button 
        class="w-12 h-12 rounded-md border border-gray-300 bg-white inline-flex items-center justify-center transition-all active:scale-90 hover:border-red-500" 
        :aria-label="hasWish ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'" 
        @click="toggleWish"
      >
        <HeartIcon :size="20" :class="hasWish ? 'text-red-500 fill-red-500' : 'hover:text-red-500'" />
      </button>
    </div>

    <!-- Toast - Enhanced Animation -->
    <Transition name="toast">
      <div 
        v-if="toast" 
        class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2"
      >
        <CheckCircle :size="16" class="text-green-400" />
        <span>{{ toastText }}</span>
      </div>
    </Transition>

  <!-- ورقة مرجع المقاس السفلية -->
  <div v-if="sizeGuideOpen" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/50" @click="closeSizeGuide"></div>
    <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-[12px] p-4 max-h-[70vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-[16px]">مرجع المقاس</h3>
        <button class="text-[20px]" @click="closeSizeGuide">×</button>
      </div>
      <div class="text-[13px] text-gray-700 leading-relaxed">
        <div v-if="sizeGuideHtml" v-html="sizeGuideHtml"></div>
        <template v-else>
          <p>تحويلات تقريبية: XS (EU 34) • S (EU 36) • M (EU 38) • L (EU 40) • XL (EU 42) • XXL (EU 44)</p>
          <p class="mt-2">قد تختلف المقاسات حسب التصميم والخامة. يُفضل مراجعة التعليقات لمعرفة الانطباعات عن الملاءمة.</p>
        </template>
      </div>
    </div>
  </div>
  <!-- إشعار: يرجى تحديد الخيارات (يظهر فوق النافذة) -->
  <Transition name="fade">
    <div v-if="requireOptionsNotice" class="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div class="bg-black/80 text-white text-[13px] px-4 py-2.5 rounded-md shadow-lg">
        يرجى تحديد الخيارات
      </div>
    </div>
  </Transition>
  <!-- Policy bottom sheet -->
  <div v-if="policyOpenKey" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closePolicy"></div>
    <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-[12px] p-4 min-h-[50vh] max-h-[70vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-[16px]">{{ policyTitle }}</h3>
        <button class="text-[20px]" @click="closePolicy">×</button>
      </div>
      <div class="text-[13px] text-gray-700 leading-relaxed" v-html="policyContent"></div>
    </div>
  </div>
  <!-- Description full-screen sheet -->
  <div v-if="descOpen" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="descOpen=false"></div>
    <Transition enter-active-class="transition-transform duration-300" enter-from-class="translate-y-full" enter-to-class="translate-y-0" leave-active-class="transition-transform duration-300" leave-from-class="translate-y-0" leave-to-class="translate-y-full">
    <div class="absolute left-0 right-0 bottom-0 bg-white rounded-t-[12px] p-0 max-h-[70vh] overflow-y-auto shadow-xl">
      <div class="relative flex items-center justify-center p-3 border-b">
        <button class="absolute left-3 top-1/2 -translate-y-1/2" @click="descOpen=false" aria-label="إغلاق">
          <X :size="22" />
        </button>
        <div class="text-[16px] font-bold">وصف</div>
      </div>
      <div class="p-4">
         <div v-if="descPairs.length" class="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] gap-y-0 gap-x-6 text-[13px]">
          <template v-for="(it,idx) in descPairs" :key="'dp-'+idx">
            <div class="text-gray-600 text-right pr-1">{{ it.k }}</div>
            <div class="text-gray-800 text-right pl-6" dir="rtl">{{ it.v }}</div>
          </template>
          <template v-if="product?.sku">
            <div class="text-gray-600 text-right pr-1">SKU</div>
            <div class="text-gray-800 text-right pl-6 flex items-center gap-2" dir="rtl">
              <span class="font-mono break-all">{{ product.sku }}</span>
              <button class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-transparent active:scale-95" @click="copyText(String(product.sku))" aria-label="نسخ SKU">
                <Copy :size="16" class="text-blue-600" />
              </button>
            </div>
          </template>
          <template v-if="product && product.id">
            <div class="text-gray-600 text-right pr-1">ID</div>
            <div class="text-gray-800 text-right pl-6 flex items-center gap-2" dir="rtl">
              <span class="font-mono break-all">{{ product.id }}</span>
              <button class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-transparent active:scale-95" @click="copyText(String(product.id))" aria-label="نسخ ID">
                <Copy :size="16" class="text-blue-600" />
              </button>
            </div>
          </template>
        </div>
        <div v-else>
          <div class="prose prose-sm max-w-none text-gray-800" v-html="safeDescription"></div>
           <div class="mt-4 grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] gap-y-0 gap-x-6 text-[13px]">
            <template v-if="product?.sku">
              <div class="text-gray-600 text-right pr-1">SKU</div>
              <div class="text-gray-800 text-right pl-6 flex items-center gap-2" dir="rtl">
                <span class="font-mono break-all">{{ product.sku }}</span>
                <button class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-transparent active:scale-95" @click="copyText(String(product.sku))" aria-label="نسخ SKU">
                  <Copy :size="16" class="text-blue-600" />
                </button>
              </div>
            </template>
            <template v-if="product && product.id">
              <div class="text-gray-600 text-right pr-1">ID</div>
              <div class="text-gray-800 text-right pl-6 flex items-center gap-2" dir="rtl">
                <span class="font-mono break-all">{{ product.id }}</span>
                <button class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-transparent active:scale-95" @click="copyText(String(product.id))" aria-label="نسخ ID">
                  <Copy :size="16" class="text-blue-600" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    </Transition>
  </div>
  <!-- Modal: pick options if missing -->
<ProductOptionsModal
    v-if="optionsModalOpen"
    :onClose="()=>{ optionsModalOpen=false }"
    :onSave="onOptionsModalSave"
    :product="{ id, title: title, price: Number(price)||0, images: images, colors: colorVariants.map(c=>({ label:c.name, img:c.image })), sizes: sizeOptions, sizeGroups: (sizeGroups||[]) }"
    :selectedColor="currentColorName"
    :selectedSize="(sizeGroups && sizeGroups.length) ? Object.entries(selectedGroupValues).map(([k,v])=> `${k}:${v}`).join('|') : size"
    :groupValues="(sizeGroups && sizeGroups.length) ? selectedGroupValues : undefined"
    :hideTitle="true"
    primaryLabel="إضافة إلى السلة"
    :showWishlist="true"
    wishlistLabel="إضافة إلى المفضلة"
    :onWishlist="toggleWish"
    :wishlistActive="hasWish"
  />
  <!-- Shipping details full-screen sheet -->
  <Transition enter-active-class="transition-transform duration-300" enter-from-class="-translate-x-full" enter-to-class="translate-x-0" leave-active-class="transition-transform duration-300" leave-from-class="translate-x-0" leave-to-class="-translate-x-full">
  <div v-if="shippingDetailsOpen" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/50" @click="closeShippingDetails"></div>
    <div class="absolute inset-0 bg-[#fafafa] flex flex-col transform">
      <div class="relative flex items-center justify-center p-3 border-b">
        <button class="absolute right-3 top-1/2 -translate-y-1/2" @click="closeShippingDetails">
          <ChevronRight :size="22" />
        </button>
        <div class="text-[16px] font-bold">معلومات الشحن والتوصيل</div>
      </div>
      <div class="p-3 space-y-3">
        <div class="p-3 rounded-lg border bg-white flex items-center justify-between" role="button" @click="router.push(`/address?return=${encodeURIComponent('/p?id='+id)}`)">
          <div>
            <div class="text-[14px] font-semibold mb-0.5">الشحن إلى :</div>
            <div class="text-[13px] text-gray-700">{{ selectedAddress ? (selectedAddress.state||'') + ' - ' + (selectedAddress.city||'') : 'لا يوجد عنوان محفوظ' }}</div>
          </div>
          <ChevronLeft :size="18" class="text-gray-500" />
        </div>
        <div class="p-3 rounded-lg border bg-white">
          <div class="mb-2 text-[14px] font-semibold">تسليم</div>
          <div class="w-full border rounded-lg overflow-hidden">
          <div class="grid grid-cols-3 text-[13px] bg-gray-50 border-b">
            <div class="p-2">التكاليف</div>
            <div class="p-2">زمن الشحن</div>
            <div class="p-2">وسيلة الشحن</div>
          </div>
          <div v-for="(m,i) in shippingMethods" :key="m.id||i" class="grid grid-cols-3 text-[13px] border-b last:border-b-0">
            <div class="p-2">{{ Number(m.price||0) }} {{ shippingCurrency }}</div>
            <div class="p-2">{{ formatEtaRange(m?.etaMinHours, m?.etaMaxHours) || (m.desc||'') }}</div>
            <div class="p-2">{{ m.offerTitle || m.name }}</div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Transition>
  <!-- Fit Profile Modal -->
  <div v-if="fitModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="closeFitModal"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl w-[92%] max-w-lg p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-extrabold text-[18px]">بيانات المقاس الشخصية</h3>
        <button class="text-[20px]" @click="closeFitModal">×</button>
      </div>
      <div class="grid gap-4">
        <label class="text-[13px] text-gray-800 font-medium">الطول (سم)
          <input type="number" inputmode="numeric" class="input w-full h-11 text-[14px] border border-gray-300 rounded-md placeholder-gray-400" v-model="fitHeight" placeholder="مثال: 170" />
        </label>
        <label class="text-[13px] text-gray-800 font-medium">الوزن (كجم)
          <input type="number" inputmode="numeric" class="input w-full h-11 text-[14px] border border-gray-300 rounded-md placeholder-gray-400" v-model="fitWeight" placeholder="مثال: 65" />
        </label>
        <label class="text-[13px] text-gray-800 font-medium">العرض أو قياس الصدر/الوسط (سم)
          <input type="number" inputmode="numeric" class="input w-full h-11 text-[14px] border border-gray-300 rounded-md placeholder-gray-400" v-model="fitWidth" placeholder="مثال: 90" />
        </label>
      </div>
      <div class="flex gap-2 justify-end mt-5">
        <button class="btn btn-outline h-10 px-4 text-[14px]" @click="closeFitModal">إلغاء</button>
        <button class="btn h-10 px-5 text-[14px]" style="background-color:#8a1538;color:white" @click="saveFitProfile">حفظ</button>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
// ==================== IMPORTS ====================
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount, watch, nextTick } from 'vue'
import { useCart } from '@/store/cart'
import ProductOptionsModal from '@/components/ProductOptionsModal.vue'
import { API_BASE, apiPost, apiGet } from '@/lib/api'
import { 
  ShoppingCart, Share, Menu, 
  Star as StarIcon, Heart as HeartIcon,
  ChevronLeft, ChevronRight, Camera, ThumbsUp, Truck, DollarSign, 
  RotateCcw, ShieldCheck, ChevronUp, CheckCircle, Store, Copy, X
} from 'lucide-vue-next'

// ==================== ROUTE & ROUTER ====================
const route = useRoute()
const router = useRouter()
const id = route.query.id as string || 'p1'
const descOpen = ref(false)

// ==================== PRODUCT DATA ====================
const product = ref<any>(null)
const title = ref('منتج تجريبي')
const price = ref<number>(129)
const original = ref('')
const images = ref<string[]>([])
const allImages = ref<string[]>([])
const activeIdx = ref(0)
const activeImg = computed(()=> images.value[activeIdx.value] || '')
const displayPrice = computed(()=> (Number(price.value)||0) + ' ر.س')
const categorySlug = ref<string>('')
const brand = ref<string>('')
const categoryName = ref<string>('')
const safeDescription = computed(()=>{
  try{
    const html = String(product.value?.description||'')
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,'')
  }catch{ return '' }
})
const descPairs = computed(()=>{
  try{
    const div = document.createElement('div')
    div.innerHTML = safeDescription.value
    const pairs: Array<{k:string;v:string}> = []
    // Prefer two-column tables or paragraphs with colon
    div.querySelectorAll('tr').forEach(tr=>{
      const tds = tr.querySelectorAll('td,th'); if (tds.length>=2){
        const k = (tds[0].textContent||'').trim().replace(/^(البند|العنصر|Item)\s*:?\s*/i,'')
        const v = (tds[1].textContent||'').trim().replace(/^(القيمة|Value)\s*:?\s*/i,'')
        if (k || v) pairs.push({ k, v })
      }
    })
    if (!pairs.length){
      const texts: string[] = []
      div.querySelectorAll('p,li,div').forEach(p=>{ const t=(p.textContent||'').trim(); if(t) texts.push(t) })
      for (const t of texts){
        const m = t.split(/[:：]/); if (m.length===2){
          const k = m[0].trim().replace(/^(البند|العنصر|Item)\s*$/i,'')
          const v = m[1].trim().replace(/^(القيمة|Value)\s*$/i,'')
          if (k || v) pairs.push({ k, v })
        }
      }
    }
    return pairs
  }catch{ return [] as Array<{k:string;v:string}> }
})
const descRef = ref<HTMLElement|null>(null)
// Remove any built-in labels like "البند"/"القيمة" if present in CMS HTML and add spacing between key/value
watch(descRef, ()=>{
  try{
    const el = descRef.value; if(!el) return;
    // Normalize simple key:value lines into two-column flex on small HTML structures
    el.querySelectorAll('p').forEach(p=>{
      const t = (p.textContent||'').trim();
      if (!t) return;
      // Strip explicit labels
      const stripped = t.replace(/^\s*(البند|العنصر|Item)\s*[:：]\s*/i,'').replace(/\s*(\||\-|\–|—)\s*(القيمة|Value)\s*[:：]\s*/i,' ')
      // Try split on colon
      const parts = stripped.split(/[:：]/);
      if (parts.length===2){
        const k = parts[0].trim(); const v = parts[1].trim();
        if (k && v){ p.innerHTML = `<span class="desc-k">${k}</span><span class="desc-v">${v}</span>`; p.classList.add('kv-row') }
      }
    })
  }catch{}
})

// ==================== PRODUCT VARIANTS ====================
// Color Variants
const colorVariants = ref<any[]>([])
const colorGalleries = ref<Array<{ name:string; primaryImageUrl?:string|null; isPrimary:boolean; order:number; images:string[] }>>([])

function normColorName(s:string): string { return String(s||'').trim().toLowerCase() }
function findGalleryForColor(name:string){
  const n = normColorName(name)
  // exact
  let g = colorGalleries.value.find(x=> normColorName(x.name) === n)
  if (g) return g
  // contains either way (to tolerate "أزرق فاتح" مقابل "أزرق")
  g = colorGalleries.value.find(x=> normColorName(x.name).includes(n) || n.includes(normColorName(x.name)))
  if (g) return g
  return undefined
}
const colorIdx = ref(0)

// Size Options
const sizeOptions = ref<string[]>([])
const size = ref<string>('')
// Multi-group sizes support
const sizeGroups = ref<Array<{ label: string; values: string[] }>>([])
const selectedGroupValues = ref<Record<string,string>>({})
const optionsModalOpen = ref(false)
watch(optionsModalOpen, (open)=>{
  try {
    if (open){
      document.body.classList.add('overflow-hidden')
      document.documentElement.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
      document.documentElement.classList.remove('overflow-hidden')
    }
  } catch {}
})
function isOptionsComplete(): boolean {
  // If attributes not fully loaded yet and no selection made, force modal
  try{
    if (!attrsLoaded.value){
      const hasSelection = !!size.value || Object.keys(selectedGroupValues.value||{}).length>0
      const expectsOptions = sizeGroups.value.length>0 || sizeOptions.value.length>0 || (Array.isArray(product.value?.variants) && product.value!.variants.length>0) || (Array.isArray(product.value?.sizes) && product.value!.sizes.length>0)
      if (expectsOptions && !hasSelection) return false
    }
  }catch{}
  // If there are size groups, all groups must be chosen
  if (sizeGroups.value.length) {
    for (const g of sizeGroups.value){ if (!selectedGroupValues.value[g.label]) return false }
    return true
  }
  // If there is a single size list, require size when options exist
  if (sizeOptions.value.length) return !!size.value
  return true
}
function openOptionsModal(){ optionsModalOpen.value = true }
function closeOptionsModal(){ optionsModalOpen.value = false }
async function onConfirmOptions(){
  if (!isOptionsComplete()) {
    try { requireOptionsNotice.value = true; setTimeout(()=> requireOptionsNotice.value = false, 2000) } catch {}
    return
  }
  optionsModalOpen.value = false
  await addToCartInternal()
}
function onOptionsModalSave(payload: { color: string; size: string }){
  try{
    const { color, size: picked } = payload || { color:'', size:'' }
    if (color){
      const idx = colorVariants.value.findIndex(c=> String(c?.name||'').trim() === String(color).trim())
      if (idx>=0) colorIdx.value = idx
    }
    if (picked){
      if (sizeGroups.value.length){
        const pairs = String(picked).split('|').map(seg=> seg.split(':',2)).filter(p=> p && p[0] && p[1]) as Array<[string,string]>
        const next: Record<string,string> = {}
        for (const [k,v] of pairs){ next[String(k)] = String(v) }
        selectedGroupValues.value = next
      } else {
        size.value = String(picked)
      }
    }
  }catch{}
  onConfirmOptions()
}
function onPickGroupValue(label: string, val: string){ selectedGroupValues.value = { ...selectedGroupValues.value, [label]: val } }
const variantByKey = ref<Record<string, { id:string; price?:number; stock?:number }>>({})
const selectedVariantId = computed<string|undefined>(()=>{
  const colorName = colorVariants.value[colorIdx.value]?.name || ''
  const key = `${colorName}::${size.value}`.trim()
  return variantByKey.value[key]?.id
})
const currentColorName = computed<string>(()=> colorVariants.value[colorIdx.value]?.name || '')
const selectedVariantStock = computed<number|undefined>(()=>{
  const colorName = colorVariants.value[colorIdx.value]?.name || ''
  const key = `${colorName}::${size.value}`.trim()
  const v = variantByKey.value[key]
  return v?.stock
})

// ==================== VARIANT TOKEN HELPERS ====================
// Normalize token spacing/case for robust comparisons
function normToken(s: string): string { return String(s||'').trim().toLowerCase() }
// Common Arabic/English color words and patterns
const COLOR_WORDS = new Set([
  'احمر','أحمر','احمَر','أحمَر','red','ازرق','أزرق','azraq','blue','اخضر','أخضر','green','اصفر','أصفر','yellow','وردي','زهري','pink','اسود','أسود','black','ابيض','أبيض','white','بنفسجي','violet','purple','برتقالي','orange','بني','brown','رمادي','gray','grey','سماوي','turquoise','تركوازي','تركواز','بيج','beige','كحلي','navy','ذهبي','gold','فضي','silver',
  // Arabic commercial color synonyms
  'دم الغزال','لحمي','خمري','عنابي','طوبي'
])
function isColorWord(s: string): boolean {
  const t = normToken(s)
  if (!t) return false
  if (COLOR_WORDS.has(t)) return true
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return true
  // Heuristics: words ending with "ي" in Arabic often denote color adjectives (e.g., سماوي، وردي، رمادي)
  if (/^[\p{L}\s]{2,}$/u.test(s) && /ي$/.test(s)) return true
  return false
}
// Size detection supports EN codes, numbers, and common Arabic words
function looksSizeToken(s: string): boolean {
  const normalized = String(s||'').replace(/[\u0660-\u0669]/g, (d)=> String((d as any).charCodeAt(0)-0x0660))
  const t = normToken(normalized)
  if (!t) return false
  if (/^(xxs|xs|s|m|l|xl|xxl|xxxl)$/i.test(t)) return true
  if (/^\d{1,2}xl$/i.test(t)) return true // 2XL, 3XL ...
  if (/^(\d{2}|\d{1,3})$/.test(t)) return true
  // Arabic size words
  if (/^(صغير|وسط|متوسط|كبير|كبير جدا|فري|واحد|حر|طفل|للرضع|للنساء|للرجال|واسع|ضيّق)$/.test(t)) return true
  return false
}
// Split composite like "أحمر - M" or "Red / XL"
function splitTokens(s: string): string[] {
  return String(s||'')
    .split(/[\s,،\/\-\|:]+/)
    .map(x=>x.trim())
    .filter(Boolean)
}

// Normalize display for Arabic-Indic digits to ensure consistent buttons text in CI and UI
function displayGroupValue(val: string): string {
  try { return String(val||'').replace(/[\u0660-\u0669]/g, (d)=> String(d.charCodeAt(0)-0x0660)) } catch { return String(val||'') }
}

// ==================== HEADER & NAVIGATION ====================
const showHeaderSearch = ref(false)
const showHeaderPrice = ref(false)
const showRecommendationStrip = ref(false)

// Refs for scroll calculations
const priceRef = ref<HTMLDivElement | null>(null)
const sizeSelectorRef = ref<HTMLDivElement | null>(null)
const firstContainerEnd = ref<HTMLDivElement | null>(null)

// Tabs (reviews tab appears only when there are reviews; defined after reviews ref)
const activeTab = ref('products')
const tabsRef = ref<HTMLDivElement | null>(null)
const tabsSticky = ref(false)

// Content sections refs
const productsContentRef = ref<HTMLDivElement | null>(null)
const reviewsContentRef = ref<HTMLDivElement | null>(null)
const recommendationsContentRef = ref<HTMLDivElement | null>(null)
const recommendationTabsRef = ref<HTMLDivElement | null>(null)

// Scroll to section when clicking tabs
function scrollToSection(tabKey: string) {
  let targetRef: HTMLDivElement | null = null
  const headerOffset = 120
  
  if (tabKey === 'products' && galleryRef.value) {
    targetRef = galleryRef.value
  } else if (tabKey === 'reviews' && reviewsContentRef.value) {
    targetRef = reviewsContentRef.value
  } else if (tabKey === 'recommendations' && recommendationsContentRef.value) {
    targetRef = recommendationsContentRef.value
  }
  
  if (targetRef) {
    const elementPosition = targetRef.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - headerOffset
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  }
}

// ==================== REVIEWS ====================
interface CustomerReview {
  id: number
  userName: string
  date: string
  rating: number
  text: string
  images?: string[]
  size: string
  color?: string
  helpful?: number
}

const customerReviews = ref<CustomerReview[]>([
  {
    id: 1,
    userName: '6***5',
    date: '2025-04-20',
    rating: 5,
    text: 'جودة المنتج: كثير يجننننن ومرتب على اللبس. صحيح لصور المنتج. نفس',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
      'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400'
    ],
    size: 'L',
    helpful: 17
  },
  {
    id: 2,
    userName: 'A***i',
    date: '2025-05-06',
    rating: 5,
    text: 'جميلة أنيقه',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'],
    size: 'L',
    helpful: 9
  },
  {
    id: 3,
    userName: 'h***k',
    date: '2025-05-16',
    rating: 5,
    text: 'جميييييييييييييييله',
    images: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=400'],
    size: 'M',
    helpful: 8
  }
])

// Tabs depend on reviews availability (initialized later once reviews defined)
const tabs = ref<Array<{ key:string; label:string }>>([
  { key: 'products', label: 'سلع' },
  { key: 'recommendations', label: 'التوصية' }
])

// ==================== RECOMMENDED PRODUCTS ====================
const isLoadingRecommended = ref(false)
const recommendedProducts = ref<any[]>([
  {
    brand: 'COSMINA',
    title: 'فستان أسود كلاسيكي أنيق',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    price: 149,
    colors: ['#000000', '#ffffff', '#2a62ff'],
    colorCount: 3,
    discountPercent: 20,
    bestRank: 2,
    soldPlus: 'باع 300+'
  },
  {
    brand: 'Elenzga',
    title: 'بلوزة صيفية مريحة',
    image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400',
    price: 89,
    colors: ['#ff6b6b', '#4ecdc4'],
    colorCount: 2,
    discountPercent: 15,
    soldPlus: 'باع 500+'
  },
  {
    brand: 'SHEIN',
    title: 'إكسسوار ذهبي فاخر',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
    price: 59,
    discountPercent: 25,
    couponPrice: 44,
    soldPlus: 'باع 200+'
  },
  {
    brand: 'SHEIN',
    title: 'جاكيت نسائي شتوي دافئ',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    price: 120,
    colors: ['#2c3e50', '#34495e'],
    colorCount: 2,
    discountPercent: 18,
    soldPlus: 'باع 400+'
  },
  {
    brand: 'Elenzga',
    title: 'بنطلون جينز نسائي كاجوال',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    price: 95,
    colors: ['#2c3e50'],
    colorCount: 1,
    discountPercent: 10,
    bestRank: 5,
    soldPlus: 'باع 600+'
  },
  {
    brand: 'COSMINA',
    title: 'تنورة نسائية قصيرة صيفية',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
    price: 75,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    colorCount: 4,
    discountPercent: 22,
    soldPlus: 'باع 350+'
  }
])

// Load More Recommended Products (Infinite Scroll)
function loadMoreRecommended() {
  if (isLoadingRecommended.value) return
  
  isLoadingRecommended.value = true
  
  // Simulate loading from API
  setTimeout(() => {
    const newProducts = [
      {
        brand: 'SHEIN',
        title: 'منتج جديد ' + (recommendedProducts.value.length + 1),
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
        price: 85,
        colors: ['#ff6b6b', '#4ecdc4'],
        colorCount: 2,
        discountPercent: 18,
        soldPlus: 'باع 400+'
      },
      {
        brand: 'Elenzga',
        title: 'منتج جديد ' + (recommendedProducts.value.length + 2),
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        price: 105,
        colors: ['#2c3e50', '#34495e'],
        colorCount: 3,
        discountPercent: 22,
        soldPlus: 'باع 350+'
      }
    ]
    
    recommendedProducts.value.push(...newProducts)
    isLoadingRecommended.value = false
  }, 1500)
}

// Navigate to recommended product
function openRecommended(p:any){ router.push(`/p?id=${encodeURIComponent(p.id||'')}`) }

// ==================== UTILITY FUNCTIONS ====================
// Format Review Date
function formatReviewDate(dateStr: string): string {
  const date = new Date(dateStr)
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  return `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()}`
}

// Open Review Image (Future Enhancement)
function openReviewImage(img: string) {
  console.log('Opening review image:', img)
  // TODO: Implement lightbox for review images
}

// Share function
async function share(){
  try{
    const data = { title: title.value, text: title.value, url: location.href }
    if ((navigator as any).share) await (navigator as any).share(data)
    else await navigator.clipboard.writeText(location.href)
  }catch{}
}

// Back to Top Button
const showBackToTop = ref(false)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Fit modal state
const fitModalOpen = ref(false)
const fitHeight = ref<string>('')
const fitWeight = ref<string>('')
const fitWidth = ref<string>('')
function openFitModal(){
  fitModalOpen.value = true
  loadFitProfile()
}
function closeFitModal(){ fitModalOpen.value = false }
async function loadFitProfile(){
  try{
    const j = await apiGet<any>('/api/me/fit-profile')
    const p = j?.profile||{}
    fitHeight.value = p.heightCm!=null? String(p.heightCm): ''
    fitWeight.value = p.weightKg!=null? String(p.weightKg): ''
    fitWidth.value = p.widthCm!=null? String(p.widthCm): ''
  }catch{}
}
async function saveFitProfile(){
  try{
    await apiPost('/api/me/fit-profile', {
      heightCm: fitHeight.value? Number(fitHeight.value): null,
      weightKg: fitWeight.value? Number(fitWeight.value): null,
      widthCm: fitWidth.value? Number(fitWidth.value): null,
    })
    closeFitModal()
  }catch{}
}

// Reviews & Rating (from API)
const avgRating = ref(4.9)
const reviews = ref<any[]>([])
// map API reviews to UI list without changing design
watch(reviews, ()=>{
  try{
    const mapped = (reviews.value||[]).slice(0,10).map((r:any,idx:number)=>({
      id: r.id ?? idx+1,
      userName: r.user?.name || r.userName || 'عميل',
      date: r.createdAt || r.date || new Date().toISOString(),
      rating: Number(r.rating || r.stars || 5),
      text: r.comment || r.text || '',
      images: Array.isArray(r.images)? r.images : [],
      size: r.size || size.value || '—',
      color: r.color || currentColorName.value || undefined,
      helpful: r.helpful || r.votes || 0,
    }))
    customerReviews.value = mapped
  }catch{}
}, { immediate: true })

// Fit distribution (placeholder logic; in production derive from reviews meta)
const fitSmallPct = computed(()=> 2)
const fitTruePct = computed(()=> Math.max(0, Math.min(100, Math.round((pdpMeta.value.fitPercent ?? 96)))))
const fitLargePct = computed(()=> Math.max(0, 100 - fitTruePct.value - fitSmallPct.value))
function barStyle(pct: number): string {
  return `width:${Math.max(0, Math.min(100, pct))}%; background-color:#8a1538;`
}

// Cart & Wishlist
const cart = useCart()
const toast = ref(false)
const toastText = ref('تمت الإضافة إلى السلة')
async function copyText(text: string){
  try{
    await navigator.clipboard.writeText(text)
    toastText.value = 'تم النسخ'
    toast.value = true
    setTimeout(()=>{ toast.value=false; toastText.value='تمت الإضافة إلى السلة' }, 1200)
  }catch{
    try{
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      toastText.value = 'تم النسخ'
      toast.value = true
      setTimeout(()=>{ toast.value=false; toastText.value='تمت الإضافة إلى السلة' }, 1200)
    }catch{}
  }
}
const requireOptionsNotice = ref(false)

async function addToCart(){
  if (!isOptionsComplete()) {
    try{ requireOptionsNotice.value = true; setTimeout(()=> requireOptionsNotice.value = false, 2000) }catch{}
    openOptionsModal();
    return
  }
  await addToCartInternal()
}
async function addToCartInternal(){
  const chosenSize = sizeGroups.value.length ? Object.entries(selectedGroupValues.value).map(([label,val])=> `${label}:${val}`).join('|') : size.value
  cart.add({ id, title: title.value, price: Number(price.value)||0, img: activeImg.value, variantColor: currentColorName.value || undefined, variantSize: chosenSize || undefined }, 1)
  try { await apiPost('/api/cart/add', { productId: id, variantId: selectedVariantId.value, quantity: 1 }) } catch {}
  try { trackAddToCart() } catch {}
  toast.value = true
  setTimeout(()=> toast.value=false, 1200)
}
const hasWish = ref(false)
// PDP Meta (badges, bestRank, fit, model, shipping destination override)
const pdpMeta = ref<{ badges?: Array<{ title:string; subtitle?:string; bgColor?:string }>; bestRank?: number|null; fitPercent?: number|null; fitText?: string|null; model?: { size?: string; height?: number; bust?: number; waist?: number; hips?: number }|null; shippingDestinationOverride?: string|null; sellerBlurb?: string|null; clubBanner?: { enabled:boolean; amount:number; discountType:'percent'|'fixed'; discountValue:number; text:string; joinUrl?:string; style?: { theme?: string; rounded?: boolean }; placement?: { pdp?: { enabled:boolean; position?: string } } }|null }>({ badges: [] })
async function loadPdpMeta(){
  try{
    const j = await apiGet<any>(`/api/product/${encodeURIComponent(id)}/meta`)
    const meta = (j && j.meta) ? j.meta : j
    if (meta && typeof meta==='object') pdpMeta.value = Object.assign({ badges: [] }, meta)
  }catch{}
}
async function loadWishlist(){
  try{
    const j = await apiGet<any>('/api/wishlist')
    const items: any[] = Array.isArray(j) ? j : Array.isArray(j?.items) ? j!.items : []
    const found = items.find((w:any)=> String(w.id||w.productId||'') === String(id))
    hasWish.value = !!found
  }catch{ hasWish.value = false }
}
async function toggleWish(){
  try{
    const r = await apiPost<any>('/api/wishlist/toggle', { productId: id })
    if (r && (r.added || r.removed)) hasWish.value = !!r.added
    else hasWish.value = !hasWish.value
  }catch{ hasWish.value = !hasWish.value }
}

// Seller info
const seller = ref<{ id?: string; name?: string; storeName?: string; storeNumber?: string; updatedAt?: string; meta?: { blurb?: string; logoUrl?: string; bannerUrl?: string; links?: { website?: string; instagram?: string; whatsapp?: string } } }|null>(null)
const sellerFollowText = computed(()=>{
  if (!seller.value?.updatedAt) return ''
  try{
    const dt = new Date(seller.value.updatedAt as any)
    const diff = Math.max(0, Date.now() - dt.getTime())
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `تمت متابعته منذ ${mins} دقيقة`
    const hours = Math.floor(mins/60)
    if (hours < 24) return `تمت متابعته منذ ${hours} ساعة`
    const days = Math.floor(hours/24)
    return `تمت متابعته منذ ${days} يوم`
  }catch{ return '' }
})
async function loadSeller(){
  try{ const j = await apiGet<any>(`/api/product/${encodeURIComponent(id)}/seller`); seller.value = j?.vendor || null }catch{}
}

// Size Guide Modal
const sizeGuideOpen = ref(false)
function openSizeGuide(){ sizeGuideOpen.value = true }
function closeSizeGuide(){ sizeGuideOpen.value = false }
// Shipping details modal (full-screen sheet)
const shippingDetailsOpen = ref(false)
function openShippingDetails(){ shippingDetailsOpen.value = true }
function closeShippingDetails(){ shippingDetailsOpen.value = false }
// Policies sheet
const policyOpenKey = ref<null|'cod'|'returns'|'secure'>(null)
const policyTitle = computed(()=>{
  const pol:any = (pdpMeta.value as any)?.policies||{}
  if (policyOpenKey.value==='cod') return pol?.cod?.title || 'خدمة الدفع عند الاستلام'
  if (policyOpenKey.value==='returns') return pol?.returns?.title || 'سياسة الإرجاع'
  if (policyOpenKey.value==='secure') return pol?.secure?.title || 'آمن للتسوق'
  return ''
})
const policyContent = computed(()=>{
  const pol:any = (pdpMeta.value as any)?.policies||{}
  if (policyOpenKey.value==='cod') return pol?.cod?.content || ''
  if (policyOpenKey.value==='returns') return pol?.returns?.content || ''
  if (policyOpenKey.value==='secure') return pol?.secure?.content || ''
  return ''
})
const policyLink = computed(()=>{
  const pol:any = (pdpMeta.value as any)?.policies||{}
  if (policyOpenKey.value==='cod') return pol?.cod?.link || ''
  if (policyOpenKey.value==='returns') return pol?.returns?.link || ''
  if (policyOpenKey.value==='secure') return pol?.secure?.link || ''
  return ''
})
function openPolicy(key:'cod'|'returns'|'secure'){
  // افتح النافذة دائماً؛ المحتوى سيتعامل مع غياب السياسات بفواصل افتراضية
  policyOpenKey.value = key
}
function closePolicy(){ policyOpenKey.value = null }

// ==================== IMAGE GALLERY & LIGHTBOX ====================
const galleryRef = ref<HTMLDivElement|null>(null)
const lightboxRef = ref<HTMLDivElement|null>(null)
const lightbox = ref(false)
const lightboxIdx = ref(0)

// Gallery scroll handler
function onGalleryScroll(){
  const el = galleryRef.value
  if (!el) return
  const scrollLeft = Math.abs(el.scrollLeft) // Handle RTL negative scrollLeft
  const i = Math.round(scrollLeft / el.clientWidth)
  if (i !== activeIdx.value) activeIdx.value = Math.max(0, Math.min(i, images.value.length - 1))
}

// Lightbox functions
function openLightbox(i:number){ 
  lightbox.value = true
  lightboxIdx.value = i
  requestAnimationFrame(()=>{ 
    const el = lightboxRef.value
    if(el) el.scrollTo({ left: i * el.clientWidth }) 
  }) 
}
function closeLightbox(){ lightbox.value = false }
function nextLightbox(){ 
  const el = lightboxRef.value
  if(!el) return
  const i = Math.min(images.value.length-1, lightboxIdx.value+1)
  lightboxIdx.value=i
  el.scrollTo({ left: i*el.clientWidth, behavior:'smooth' }) 
}
function prevLightbox(){ 
  const el = lightboxRef.value
  if(!el) return
  const i = Math.max(0, lightboxIdx.value-1)
  lightboxIdx.value=i
  el.scrollTo({ left: i*el.clientWidth, behavior:'smooth' }) 
}

// Gallery height calculation
const galleryHeight = ref<number|undefined>(undefined)
const maxAspect = ref<number>(4/3)
const maxAspectIndex = ref<number>(0)
const maxAreaIndex = ref<number>(0)
const tallestIndex = ref<number>(0)
async function computeGalleryHeight(){
  try{
    const width = galleryRef.value?.clientWidth || window.innerWidth
    const sizes: Array<{w:number,h:number,ratio:number,area:number,scaled:number}> = await Promise.all(
      images.value.map(src => new Promise<{w:number,h:number,ratio:number,area:number,scaled:number}>(resolve=>{
        const im = new Image()
        im.onload = ()=> {
          const w = im.width||width; const h = im.height||width; const ratio = h/Math.max(1,w); resolve({ w, h, ratio, area: w*h, scaled: width*ratio })
        }
        im.onerror = ()=> { const w = width, h = Math.floor(width*4/3); const ratio = h/Math.max(1,w); resolve({ w, h, ratio, area: w*h, scaled: width*ratio }) }
        im.src = src
      }))
    )
    const maxRatio = sizes.reduce((m,s)=> Math.max(m, s.ratio), 4/3)
    galleryHeight.value = Math.round(width * maxRatio)
    maxAspect.value = maxRatio
    // Mark the first image that matches max aspect (within tolerance)
    const tol = 0.005
    maxAspectIndex.value = Math.max(0, sizes.findIndex(s=> Math.abs(s.ratio - maxRatio) <= tol))
    // Choose tallest image (by scaled height at current container width)
    const maxScaled = sizes.reduce((m,s)=> Math.max(m, s.scaled), 0)
    const tallestIdx = sizes.findIndex(s=> s.scaled === maxScaled)
    if (tallestIdx >= 0) tallestIndex.value = tallestIdx
    // Set frame height to that tallest scaled height
    if (maxScaled > 0) galleryHeight.value = Math.round(maxScaled)
  }catch{}
}
// Recompute when images array updates
watch(images, async ()=>{ try{ await nextTick(); await computeGalleryHeight() }catch{} }, { deep: true })

function getImgFitClass(idx: number): string {
  try{
    if (idx === tallestIndex.value) return 'object-contain'
  }catch{}
  return 'object-cover'
}

// ==================== SCROLL HANDLING ====================
const scrolled = ref(false)
function onScroll(){ 
  const scrollY = window.scrollY
  scrolled.value = scrollY > 60 
  showBackToTop.value = scrollY > 300
  
  // 1. Show search bar in header when scrolled past images (approximately 600px)
  showHeaderSearch.value = scrollY > 600
  
  // 2. Show price in header when scrolled past price section but hide after reviews section
  if (priceRef.value && reviewsContentRef.value) {
    const priceBottom = priceRef.value.getBoundingClientRect().bottom
    const reviewsBottom = reviewsContentRef.value.getBoundingClientRect().bottom
    // Show price when scrolled past price, but hide after passing reviews section completely
    showHeaderPrice.value = priceBottom < 57 && reviewsBottom > 57 // Hide after reviews section passes header
  }
  
  // 3. Make tabs sticky when scrolled past first container
  if (firstContainerEnd.value) {
    const firstContainerEndTop = firstContainerEnd.value.getBoundingClientRect().top
    tabsSticky.value = firstContainerEndTop <= 57 // Header height
  }
  
  // 4. Infinite scroll for recommended products
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = window.scrollY
  const clientHeight = window.innerHeight
  
  if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingRecommended.value) {
    loadMoreRecommended()
  }
  
  // 5. Auto-switch tabs based on scroll position and handle recommendation strip
  const headerHeight = 57
  const tabsHeight = 49
  const viewportTop = headerHeight + tabsHeight + 50 // offset for better detection
  
  // Check if we've reached the products section (after recommendation tabs strip)
  if (recommendationTabsRef.value) {
    const recommendationTabsBottom = recommendationTabsRef.value.getBoundingClientRect().bottom
    // Show recommendation strip and hide tabs when products section is reached (tabs strip has passed)
    if (recommendationTabsBottom < headerHeight) {
      activeTab.value = 'recommendations'
      showRecommendationStrip.value = true // Show recommendation strip
      tabsSticky.value = false // Hide normal tabs when showing recommendation strip
    } else if (tabsSticky.value) {
      showRecommendationStrip.value = false
    }
  }
  
  // Only check other sections if recommendation strip is not showing
  if (tabsSticky.value && !showRecommendationStrip.value) {
    // Check recommendations section (but don't show strip yet)
    if (recommendationsContentRef.value) {
      const recommendationsTop = recommendationsContentRef.value.getBoundingClientRect().top
      if (recommendationsTop <= viewportTop) {
        activeTab.value = 'recommendations'
        return
      }
    }
    
    // Check reviews section
    if (reviewsContentRef.value) {
      const reviewsTop = reviewsContentRef.value.getBoundingClientRect().top
      if (reviewsTop <= viewportTop) {
        activeTab.value = 'reviews'
        return
      }
    }
    
    // Default to products
    activeTab.value = 'products'
  }
}

// ==================== LIFECYCLE HOOKS ====================
onMounted(()=>{ 
  onScroll()
  window.addEventListener('scroll', onScroll, { passive:true })
  computeGalleryHeight()
  window.addEventListener('resize', computeGalleryHeight, { passive:true })
  loadProductData()
  loadShipping()
  loadAddresses()
  loadPdpMeta()
  loadSeller()
  trackViewItem()
  injectHeadMeta()
  try{
    const hasAny = (!!reviews.value?.length) || (!!customerReviews.value?.length)
    const base = [ { key:'products', label:'سلع' } ] as Array<{key:string;label:string}>
    if (hasAny) base.push({ key:'reviews', label:'تعليقات' })
    base.push({ key:'recommendations', label:'التوصية' })
    tabs.value = base
  }catch{}
})

onBeforeUnmount(()=> {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', computeGalleryHeight)
})

// ==================== DATA LOADING ====================
async function loadProductData() {
  // Load product details
  try{
    const res = await fetch(`${API_BASE}/api/product/${encodeURIComponent(id)}`, { 
      credentials:'omit', 
      headers:{ 'Accept':'application/json' } 
    })
    if(res.ok){
      const d = await res.json()
      product.value = d
      title.value = d.name || title.value
      price.value = Number(d.price||129)
      const imgs = Array.isArray(d.images)? d.images : []
      allImages.value = imgs
      if (imgs.length) { images.value = imgs; try { await nextTick(); await computeGalleryHeight() } catch {} }
      // Load color galleries if present
      if (Array.isArray(d.colorGalleries)) colorGalleries.value = d.colorGalleries
      // defer color/size mapping to normalized loader
      original.value = ''
      categorySlug.value = String(d?.category?.slug||'')
      categoryName.value = String(d?.category?.name||'')
      brand.value = String(d?.brand||'')
      
      // Sizes from API if available (accept only real size tokens)
  const s = Array.isArray(d.sizes) ? (d.sizes as any[]).filter((x:any)=> typeof x==='string' && looksSizeToken(String(x).trim()) && !isColorWord(String(x).trim())) : []
      if (s.length) {
        sizeOptions.value = s as string[]
      } else {
        // If provided sizes are invalid (e.g., color names), ignore and reset
        if (!Array.isArray(d.variants) || !d.variants.length) {
          sizeOptions.value = []
          size.value = ''
        }
      }
      try { await loadNormalizedVariants() } catch {}
      // Ensure default color and size after variants load
      try {
        if (colorVariants.value.length && (colorIdx.value < 0 || colorIdx.value >= colorVariants.value.length)) colorIdx.value = 0
        if (!currentColorName.value && colorVariants.value[0]?.name) colorIdx.value = 0
      } catch {}
      try { await nextTick(); await updateImagesForColor() } catch {}
      
      // After primary data is ready, fire dependent loads (non-blocking)
      try { fetchRecommendations() } catch {}
      try { fetchSizeGuide() } catch {}
      try { loadWishlist() } catch {}
      try { injectProductJsonLd() } catch {}
      try { injectHeadMeta() } catch {}
    }
  }catch{}
  // Fallback (local preview/dev): synthesize minimal product and variants so UI renders swatches/sizes without API
  try{
    const host = typeof window !== 'undefined' ? window.location.hostname : ''
    if (!product.value && (host === 'localhost' || host === '127.0.0.1')){
      product.value = { id, name: title.value, price: price.value, images: [] }
      if (images.value.length === 0){
        images.value = [
          '/images/placeholder-product.jpg',
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800',
          'https://images.unsplash.com/photo-1520975940462-38ad61a0c87b?w=800'
        ]
        try { await nextTick(); await computeGalleryHeight() } catch {}
      }
      if (colorVariants.value.length === 0){
        colorVariants.value = [
          { name: 'أسود', image: images.value[0], isHot: false },
          { name: 'أبيض', image: images.value[1] || images.value[0], isHot: false },
          { name: 'أزرق', image: images.value[2] || images.value[0], isHot: false },
        ]
      }
      if (sizeOptions.value.length === 0){
        sizeOptions.value = ['S','M','L','XL']
        size.value = 'M'
      }
    }
  }catch{}
  
  // Load reviews
  try{
    const list = await apiGet<any>(`/api/reviews?productId=${encodeURIComponent(id)}`)
    if (list && Array.isArray(list.items)){
      reviews.value = list.items
      const sum = list.items.reduce((s:any,r:any)=>s+(r.stars||0),0)
      avgRating.value = list.items.length? (sum/list.items.length) : avgRating.value
      // Update tabs visibility based on real reviews
      try {
        const hasAny = !!reviews.value?.length
        const base = [ { key:'products', label:'سلع' } ] as Array<{key:string;label:string}>
        if (hasAny) base.push({ key:'reviews', label:'تعليقات' })
        base.push({ key:'recommendations', label:'التوصية' })
        tabs.value = base
      } catch {}
    }
  }catch{}
}

// ==================== VARIANTS (normalized API) ====================
const attrsLoaded = ref(false)
async function loadNormalizedVariants(){
  // 1) Fetch normalized variants list
  const j = await apiGet<any>(`/api/product/${encodeURIComponent(id)}/variants`).catch(()=>null)
  let list: any[] = Array.isArray(j?.items) ? j!.items : []
  if (!list.length && Array.isArray(product.value?.variants)) list = product.value.variants as any[]

  // 2) Prefer grouped attributes from product endpoint to render buttons per group
  try {
    const pd = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`).catch(()=>null)
    const attrs: Array<{ key:string; label:string; values:string[] }> = Array.isArray(pd?.attributes) ? pd!.attributes : []
    // Ingest server color galleries
    if (Array.isArray(pd?.colorGalleries)) colorGalleries.value = pd!.colorGalleries
    // Colors group
    const col = attrs.find(a=> a.key==='color')
    let colVals: string[] = Array.isArray(col?.values) ? col!.values : []
    // Fallback: use colorGalleries names if attributes didn't include colors
    if ((!colVals || !colVals.length) && Array.isArray(colorGalleries.value) && colorGalleries.value.length){
      colVals = colorGalleries.value.map(g=> String(g.name||'')).filter(Boolean)
    }
    // Map colors to images
    const imgs = images.value.slice()
    const pickImageFor = (c:string, idx:number): string => {
      const t = normToken(c)
      for (const u of imgs){ const file = u.split('/').pop() || ''; if (normToken(file).includes(t)) return u }
      return images.value[idx] || images.value[0] || ''
    }
    if (colVals.length){
      colorVariants.value = colVals.map((c, idx)=> {
        const gal = findGalleryForColor(String(c))
        const img = gal?.primaryImageUrl || gal?.images?.[0] || pickImageFor(c, idx)
        return { name: c, image: img, isHot: false }
      })
    }
    if (colorVariants.value.length && (colorIdx.value < 0 || colorIdx.value >= colorVariants.value.length)) colorIdx.value = 0
    // Prefer primary color from galleries when available
    try{
      const primary = colorGalleries.value.find(g=> !!g.isPrimary)
      if (primary){
        const p = normColorName(primary.name||'')
        const idx = colorVariants.value.findIndex(v=>{
          const n = normColorName(v.name)
          return n===p || n.includes(p) || p.includes(n)
        })
        if (idx>=0) colorIdx.value = idx
      }
    }catch{}
    // Size groups (sanitize values: split pipes/labels and keep only real size tokens)
    const groups = attrs.filter(a=> a.key==='size')
    const sanitizeSizeVal = (val: string): string => {
      const parts = String(val||'').split('|').map(s=> s.trim()).filter(Boolean)
      const candidates: string[] = []
      for (const p of parts){
        if (p.includes(':')) { const seg = p.split(':',2)[1]?.trim(); if (seg) candidates.push(seg) }
        candidates.push(p)
      }
      const pick = candidates.find(x=> looksSizeToken(x) && !isColorWord(x)) || candidates[0] || String(val||'')
      return pick
    }
    // Map and order values consistently, ensure letters group appears before numbers
    const normDigits = (s:string)=> String(s||'').replace(/[\u0660-\u0669]/g, (d)=> String((d as any).charCodeAt(0)-0x0660))
    const lettersOrder = ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL']
    const orderValues = (label:string, values:string[]): string[] => {
      if (/بالأرقام/.test(label)) return Array.from(values).sort((a,b)=> (parseInt(normDigits(a),10)||0)-(parseInt(normDigits(b),10)||0))
      if (/بالأحرف/.test(label)) return Array.from(values).sort((a,b)=> lettersOrder.indexOf(String(a).toUpperCase()) - lettersOrder.indexOf(String(b).toUpperCase()))
      return Array.from(values)
    }
    const mapped = groups.map(g=> ({ label: g.label || 'المقاس', values: Array.from(new Set((g.values||[]).map(v=> sanitizeSizeVal(String(v))))) }))
    // letters first, then numbers
    const orderedGroups = mapped.sort((a,b)=> (a.label.includes('بالأحرف')? -1 : a.label.includes('بالأرقام')? 1 : 0) - (b.label.includes('بالأحرف')? -1 : b.label.includes('بالأرقام')? 1 : 0))
    sizeGroups.value = orderedGroups.map(g=> ({ label: g.label, values: orderValues(g.label, g.values) }))
    if (sizeGroups.value.length){
      // Do not preselect size groups; require user choice
      selectedGroupValues.value = {}
    }
  } catch {} finally { attrsLoaded.value = true }

  // 3) Derive fallback only if attributes were loaded but missing
  if (attrsLoaded.value && (!colorVariants.value.length || !sizeGroups.value.length)){
    const colorSet = new Set<string>()
    const sizeSet = new Set<string>()
    const norm = (s:string)=> String(s||'').trim()
    for (const it of list){
      const name = norm((it as any).name)
      const val = norm((it as any).value)
      const colorField = norm((it as any).color)
      const sizeField = norm((it as any).size)
      if (colorField && !looksSizeToken(colorField)) colorSet.add(colorField)
      if (sizeField && !isColorWord(sizeField)) sizeSet.add(sizeField)
      if (/color|لون/i.test(name)) { if (val && !looksSizeToken(val)) colorSet.add(val) }
      else if (/size|مقاس/i.test(name)) { if (val && looksSizeToken(val)) sizeSet.add(val) }
      else {
        const tokens = splitTokens(`${name} ${val}`)
        for (const t of tokens){ if (looksSizeToken(t)) sizeSet.add(t); else if (isColorWord(t)) colorSet.add(t) }
      }
    }
    const colors = Array.from(colorSet)
    if (!colorVariants.value.length){
      const imgs = images.value.slice()
      const pickImageFor = (c:string, idx:number): string => {
        const t = normToken(c)
        for (const u of imgs){ const file = u.split('/').pop() || ''; if (normToken(file).includes(t)) return u }
        return images.value[idx] || images.value[0] || ''
      }
      if (colors.length){
        colorVariants.value = colors.map((c, idx)=> ({ name: c, image: pickImageFor(c, idx), isHot: false }))
        if (colorVariants.value.length && (colorIdx.value < 0 || colorIdx.value >= colorVariants.value.length)) colorIdx.value = 0
      }
    }
    if (!sizeOptions.value.length){
      const sizesFromProduct = Array.isArray(product.value?.sizes) ? (product.value!.sizes as string[]) : []
      const sizesFromVariants = Array.from(sizeSet)
      const sizes = sizesFromProduct.length ? sizesFromProduct : sizesFromVariants
      sizeOptions.value = sizes.length ? sizes : []
      if (!size.value) size.value = sizeOptions.value[0] || ''
    }
  }

  // 3b) Strengthen size-groups using variants' attributes_map when API attributes are ambiguous
  try {
    const letters = new Set<string>()
    const numbers = new Set<string>()
    const put = (group: 'letters'|'numbers', raw: string) => {
      const parts = String(raw||'').split('|').map(s=> s.trim()).filter(Boolean)
      const cands: string[] = []
      for (const p of parts){ if (p.includes(':')) { const seg=p.split(':',2)[1]?.trim(); if (seg) cands.push(seg) } cands.push(p) }
      const pick = cands.find(x=> looksSizeToken(x) && !isColorWord(x)) || cands[0] || String(raw||'')
      if (group==='letters') letters.add(pick); else numbers.add(pick)
    }
    for (const it of list){
      const m = (it as any).attributes_map || {}
      // Prefer labeled groups when present
      for (const [k,v] of Object.entries(m)){
        if (!String(k).startsWith('size_')) continue
        const label = String(k).slice('size_'.length)
        if (/بالأحرف/.test(label)) put('letters', String(v))
        else if (/بالأرقام/.test(label)) put('numbers', String(v))
        else {
          // Generic: classify by digits vs letters
          const val = String(v||'')
          const parts = val.split('|').map(s=> s.trim()).filter(Boolean)
          const pick = parts.find(x=> /^\d{1,3}$/.test(x)) || parts.find(x=> looksSizeToken(x)) || parts[0] || val
          if (/^\d{1,3}$/.test(pick)) numbers.add(pick); else letters.add(pick)
        }
      }
    }
    const nextGroups: Array<{ label: string; values: string[] }> = []
    if (letters.size) nextGroups.push({ label: 'مقاسات بالأحرف', values: Array.from(letters) })
    if (numbers.size) nextGroups.push({ label: 'مقاسات بالأرقام', values: Array.from(numbers) })
    if (nextGroups.length) {
      const normDigits = (s:string)=> String(s||'').replace(/[\u0660-\u0669]/g, (d)=> String((d as any).charCodeAt(0)-0x0660))
      const lettersOrder = ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL']
      const orderValues = (label:string, values:string[]): string[] => {
        if (/بالأرقام/.test(label)) return Array.from(values).sort((a,b)=> (parseInt(normDigits(a),10)||0)-(parseInt(normDigits(b),10)||0))
        if (/بالأحرف/.test(label)) return Array.from(values).sort((a,b)=> lettersOrder.indexOf(String(a).toUpperCase()) - lettersOrder.indexOf(String(b).toUpperCase()))
        return Array.from(values)
      }
      sizeGroups.value = nextGroups.map(g=> ({ label: g.label, values: orderValues(g.label, g.values) }))
      // Do not preselect group values
      selectedGroupValues.value = {}
    }
  } catch {}

  // 4) Build a best-effort variant map for selection to stock/price
  const norm = (s:string)=> String(s||'').trim()
  const colors = colorVariants.value.map(c=>c.name)
  const map: Record<string, { id:string; price?:number; stock?:number }> = {}
  for (const it of list){
    const tokens = `${norm((it as any).name)} ${norm((it as any).value)}`.toLowerCase()
    for (const c of colors){
      const baseSizes = (sizeOptions.value.length? sizeOptions.value : [''])
      const composite = sizeGroups.value.length ? [ Object.entries(selectedGroupValues.value).map(([label,val])=> `${label}:${val}`).join('|') ] : baseSizes
      for (const s of composite){
        const key = `${c}::${s}`.trim()
        const hasC = c && (tokens.includes(String(c).toLowerCase()) || String((it as any).color||'').toLowerCase()===String(c).toLowerCase())
        const hasS = s ? (tokens.includes(String(s).toLowerCase()) || String((it as any).size||'').toLowerCase()===String(s).toLowerCase()) : true
        if (hasC && hasS && !map[key]) map[key] = { id:String(it.id), price: (it.price!=null? Number(it.price): undefined), stock: (it.stockQuantity!=null? Number(it.stockQuantity): undefined) }
      }
    }
  }
  variantByKey.value = map
  const colorName = colorVariants.value[colorIdx.value]?.name || ''
  const k = `${colorName}::${size.value}`.trim()
  if (map[k] && typeof map[k].price === 'number') price.value = Number(map[k].price)
  try { await nextTick(); await updateImagesForColor() } catch {}
}

// React on variant change
watch([colorIdx, size, selectedGroupValues], ()=>{
  try{
    const colorName = colorVariants.value[colorIdx.value]?.name || ''
    const composite = sizeGroups.value.length ? Object.entries(selectedGroupValues.value).map(([label,val])=> `${label}:${val}`).join('|') : size.value
    const k = `${colorName}::${composite}`.trim()
    const v = variantByKey.value[k]
    if (v && typeof v.price === 'number') price.value = Number(v.price)
  }catch{}
})

// Ensure hero image follows selected color (when available)
watch(colorIdx, ()=>{
  try{
    updateImagesForColor()
  }catch{}
})

// ==================== RECOMMENDATIONS FETCH ====================
async function fetchRecommendations(){
  try{
    isLoadingRecommended.value = true
    const sim = await apiGet<any>(`/api/recommendations/similar/${encodeURIComponent(id)}`)
    const list = Array.isArray(sim?.items) ? sim!.items : []
    if (list.length) {
      recommendedProducts.value = list.map((it:any)=> ({
        id: it.id,
        brand: it.brand||'',
        title: it.name||'',
        image: Array.isArray(it.images)&&it.images[0]? it.images[0]: '',
        price: Number(it.price||0),
      }))
      return
    }
  }catch{}
  try{
    const rec = await apiGet<any>('/api/recommendations/recent')
    const items = Array.isArray(rec?.items) ? rec!.items : []
    recommendedProducts.value = items.map((it:any)=> ({
      id: it.id,
      brand: it.brand||'',
      title: it.name||'',
      image: Array.isArray(it.images)&&it.images[0]? it.images[0]: '',
      price: Number(it.price||0),
    }))
  }catch{} finally { isLoadingRecommended.value = false }
}

// ==================== SIZE GUIDE (CMS) ====================
const sizeGuideHtml = ref<string>('')
async function fetchSizeGuide(){
  const slugs: string[] = []
  if (brand.value && String(brand.value).trim()) slugs.push(`size-guide:${String(brand.value).trim().toLowerCase()}`)
  if (categorySlug.value) slugs.push(`size-guide:${categorySlug.value}`)
  slugs.push('size-guide:default')
  for (const s of slugs){
    try{
      const j = await apiGet<any>(`/api/cms/page/${encodeURIComponent(s)}`)
      if (j?.page?.content) { sizeGuideHtml.value = String(j.page.content); break }
    }catch{}
  }
}

// ==================== SHIPPING/RETURNS DYNAMIC ====================
const shippingMethods = ref<Array<{ id:string; name:string; desc:string; price:number; offerTitle?:string; etaMinHours?:number; etaMaxHours?:number }>>([])
const shippingQuote = ref<number|undefined>(undefined)
// Address and destination
const addresses = ref<any[]>([])
const selectedAddress = ref<any|null>(null)
const destinationText = computed(()=>{
  if (selectedAddress.value) {
    const st = String(selectedAddress.value.state||'').trim()
    const ct = String(selectedAddress.value.city||'').trim()
    const parts = [st, ct].filter(Boolean)
    if (parts.length) return parts.join(' - ')
  }
  return 'اليمن'
})
const shippingCurrency = computed(()=>{
  const c = String(selectedAddress.value?.country||'').toLowerCase()
  if (c.includes('yemen') || c.includes('اليمن')) return 'ر.ي'
  return 'ر.س'
})
function formatEtaRange(minH:number|undefined|null, maxH:number|undefined|null): string {
  const min = Number(minH||0); const max = Number(maxH||0)
  if (max<=0 && min<=0) return ''
  const a = Math.max(0, min||max)
  const b = Math.max(a, max)
  // حوّل إلى أيام عند تجاوز 24 ساعة
  if (b >= 24) {
    const da = Math.ceil(a/24)
    const db = Math.ceil(b/24)
    if (da === db) return `${db} أيام`
    return `${da}-${db} أيام`
  }
  return `${a}-${b} ساعات`
}
const shippingTitleText = computed(()=>{
  const m:any = shippingMethods.value?.[0]
  if (!m) return ''
  const priceNum = Number(m.price||0)
  const priceText = priceNum>0 ? `${priceNum} ${shippingCurrency.value}` : 'مجاني'
  const offer = (m.offerTitle || m.name || '')
  return `${offer ? offer + ' ' : ''}(${priceText})`.trim()
})
const shippingEtaText = computed(()=>{
  const m:any = shippingMethods.value?.[0]
  const s = formatEtaRange(m?.etaMinHours, m?.etaMaxHours)
  return s || m?.desc || ''
})
async function loadShipping(){
  try{
    const m = await apiGet<any>('/api/shipping/methods')
    shippingMethods.value = Array.isArray(m?.items)? m!.items : []
  }catch{}
  try{
    const q = await apiGet<any>('/api/shipping/quote?method=std')
    if (q && typeof q.price === 'number') shippingQuote.value = Number(q.price)
  }catch{}
}

// Load saved addresses and pick default
async function loadAddresses(){
  try{
    const j = await apiGet<any>('/api/addresses')
    const list = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : []
    addresses.value = list
    selectedAddress.value = list.find((a:any)=> a.isDefault) || list[0] || null
  }catch{ addresses.value = []; selectedAddress.value = null }
}

// ==================== ANALYTICS EVENTS ====================
function trackViewItem(){
  try{
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push({ event:'view_item', ecommerce:{ items:[{ item_id:id, item_name:title.value, price:Number(price.value||0) }] } })
  }catch{}
  try{
    const fbq = (window as any).fbq; if (typeof fbq==='function') fbq('track','ViewContent',{ content_ids:[id], content_type:'product', value:Number(price.value||0), currency:'SAR' })
  }catch{}
}
function trackAddToCart(){
  try{ (window as any).dataLayer?.push({ event:'add_to_cart', ecommerce:{ items:[{ item_id:selectedVariantId.value||id, item_name:title.value, price:Number(price.value||0), quantity:1 }] } }) }catch{}
  try{ const fbq = (window as any).fbq; if (typeof fbq==='function') fbq('track','AddToCart',{ content_ids:[selectedVariantId.value||id], content_type:'product', value:Number(price.value||0), currency:'SAR' }) }catch{}
}

// ==================== SEO: JSON-LD ====================
function injectProductJsonLd(){
  try{
    const data: any = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: title.value,
      image: images.value && images.value.length ? images.value : undefined,
      brand: brand.value ? { '@type':'Brand', name: brand.value } : undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'SAR',
        price: Number(price.value||0),
        availability: 'https://schema.org/InStock',
      }
    }
    if (reviews.value && reviews.value.length){
      const sum = reviews.value.reduce((s:any,r:any)=> s + Number(r.rating||r.stars||0), 0)
      const avg = reviews.value.length ? (sum / reviews.value.length) : 0
      data.aggregateRating = { '@type':'AggregateRating', ratingValue: Number(avg.toFixed(1)), reviewCount: reviews.value.length }
    }
    const elId = 'pdp-jsonld'
    let el = document.getElementById(elId) as HTMLScriptElement | null
    if (!el){
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.id = elId
      document.head.appendChild(s)
      el = s
    }
    if (el) el.textContent = JSON.stringify(data)
  }catch{}
}

// ==================== SEO HEAD (canonical/OG) ====================
function injectHeadMeta(){
  try{
    const url = new URL(window.location.href)
    const canonical = document.querySelector('link[rel="canonical"]') || (()=>{ const l = document.createElement('link'); l.rel='canonical'; document.head.appendChild(l); return l })()
    ;(canonical as HTMLLinkElement).href = url.href
    const setMeta = (p:string,c:string)=>{ let m = document.querySelector(`meta[property="${p}"]`) as HTMLMetaElement|null; if(!m){ m = document.createElement('meta'); m.setAttribute('property', p); document.head.appendChild(m) } m.content = c }
    setMeta('og:title', title.value)
    setMeta('og:type', 'product')
    if (images.value[0]) setMeta('og:image', images.value[0])
    setMeta('og:url', url.href)
    setMeta('product:price:amount', String(Number(price.value||0)))
    setMeta('product:price:currency', 'SAR')
  }catch{}
}
// ==================== CLUB THEME HELPERS ====================
const clubThemeClass = computed(()=>{
  const theme = (pdpMeta.value as any)?.clubBanner?.style?.theme || 'orange'
  switch (theme){
    case 'rose': return 'bg-rose-50 hover:bg-rose-100'
    case 'amber': return 'bg-amber-50 hover:bg-amber-100'
    case 'emerald': return 'bg-emerald-50 hover:bg-emerald-100'
    case 'violet': return 'bg-violet-50 hover:bg-violet-100'
    default: return 'bg-orange-50 hover:bg-orange-100'
  }
})
const clubTextClass = computed(()=>{
  const theme = (pdpMeta.value as any)?.clubBanner?.style?.theme || 'orange'
  switch (theme){
    case 'rose': return 'text-rose-700'
    case 'amber': return 'text-amber-700'
    case 'emerald': return 'text-emerald-700'
    case 'violet': return 'text-violet-700'
    default: return 'text-orange-700'
  }
})
const clubAvatarStyle = computed(()=>{
  const theme = (pdpMeta.value as any)?.clubBanner?.style?.theme || 'orange'
  const rounded = !!((pdpMeta.value as any)?.clubBanner?.style?.rounded ?? true)
  const bg = theme==='rose'? '#f43f5e' : theme==='amber'? '#f59e0b' : theme==='emerald'? '#10b981' : theme==='violet'? '#7c3aed' : '#f97316'
  return `background:${bg}; ${rounded? 'border-radius:12px' : 'border-radius:4px'}`
})
function goTo(url:string){ try{ window.location.href = url }catch{} }
function imageAt(i:number): string {
  try{
    const arr = images.value||[]
    if (!Array.isArray(arr) || arr.length===0) return '/images/placeholder-product.jpg'
    const idx = Math.max(0, (i % arr.length))
    return arr[idx]
  }catch{ return '/images/placeholder-product.jpg' }
}

// Helper: update gallery based on selected color
function dedup(arr: string[]): string[]{
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of arr){ if (u && !seen.has(u)){ seen.add(u); out.push(u) } }
  return out
}
function findImageIndex(arr: string[], target?: string): number{
  if (!target) return -1
  const strip = (u:string)=> String(u||'').split('?')[0].split('#')[0]
  const tf = strip(target).split('/').pop()||''
  // exact first
  let idx = arr.findIndex(x=> x === target)
  if (idx>=0) return idx
  // strip query/hash
  idx = arr.findIndex(x=> strip(x) === strip(target))
  if (idx>=0) return idx
  // match by filename suffix
  idx = arr.findIndex(x=> (x.split('?')[0].split('#')[0].endsWith(tf)))
  return idx
}
function scrollToIndex(el: HTMLElement, idx: number, behavior: ScrollBehavior = 'auto'){
  const w = el.clientWidth || 1
  try { el.scrollTo({ left: idx*w, behavior }) } catch {}
  // RTL/WebKit fallback
  if (Math.round(Math.abs((el as any).scrollLeft)/w) !== idx){
    try { (el as any).scrollLeft = idx*w } catch {}
  }
  if (Math.round(Math.abs((el as any).scrollLeft)/w) !== idx){
    try { (el as any).scrollLeft = -idx*w } catch {}
  }
}
async function updateImagesForColor(){
  try{
    const c = colorVariants.value[colorIdx.value]
    if (!c) return
    const gal = findGalleryForColor(String(c.name))
    const hero = c.image || gal?.primaryImageUrl || (Array.isArray(gal?.images)? gal!.images[0] : undefined)
    if (gal && Array.isArray(gal.images) && gal.images.length > 1){
      const arr = gal.images.slice()
      if (hero){ const i = arr.findIndex(x=> x===hero); if (i>0){ arr.splice(i,1); arr.unshift(hero) } else if (i<0 && hero){ arr.unshift(hero) } }
      images.value = dedup(arr)
    } else {
      // If the selected color has only one image, keep the full gallery
      // and just focus the hero (color) image
      const arr = allImages.value.slice()
      images.value = dedup(arr)
    }
    await nextTick()
    try{ await computeGalleryHeight() }catch{}
    try{
      const el = galleryRef.value
      if (el){
        const idx = findImageIndex(images.value, (c.image || hero))
        if (idx>=0){ activeIdx.value = idx; scrollToIndex(el, idx, 'smooth') }
      }
    }catch{}
  }catch{}
}
</script>

<style scoped>
/* Scrollbar hidden */
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.3s ease;
}

.transition-transform {
  transition: transform 0.2s ease;
}

/* Hover effects */
.hover\:scale-105:hover {
  transform: scale(1.05);
}

.hover\:scale-110:hover {
  transform: scale(1.1);
}

/* Gradients */
.gradient-violet-pink {
  background: linear-gradient(135deg, rgb(139, 92, 246) 0%, rgb(236, 72, 153) 100%);
}

/* Backdrop blur support */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Toast Animation */
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.3s ease-in;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
}

/* Active state animations */
.active\:scale-95:active {
  transform: scale(0.95);
}

.active\:scale-90:active {
  transform: scale(0.90);
}

/* Fade transition for header content - Very fast */
.fade-enter-active {
  transition: opacity 0.08s ease-out;
}

.fade-leave-active {
  transition: opacity 0.05s ease-in;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Slide down transition for header elements - Instant to avoid scroll blocking */
.slide-down-enter-active {
  transition: none;
}

.slide-down-leave-active {
  transition: none;
  position: absolute;
  width: 100%;
  pointer-events: none;
}

.slide-down-enter-from {
  opacity: 0;
}

.slide-down-leave-to {
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
}

/* Carousel pages indicator */
.carousels-pagination__pages {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
}

/* Existing styles */
.kv-row { display:flex; align-items:center; justify-content:space-between; gap: 12px; }
.kv-row .desc-k { color:#4b5563; font-weight:500; }
.kv-row .desc-v { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; word-break: break-all; }
</style>

