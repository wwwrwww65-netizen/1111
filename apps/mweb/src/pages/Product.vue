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

    <!-- SHEIN Club Bar -->
    <div class="mx-4 mb-4 flex items-center justify-between px-3 py-2.5 bg-orange-50 rounded-md cursor-pointer hover:bg-orange-100 transition-colors">
        <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <span class="text-white text-[11px] font-bold">S</span>
        </div>
        <span class="text-[13px] text-gray-700">وفر بخصم 1.60 ر.س على هذا المنتج بعد الانضمام</span>
        </div>
      <ChevronLeft :size="16" class="text-gray-600" />
        </div>

    <!-- Product Info -->
    <div class="px-4">
      <div class="flex items-center gap-2 mb-2">
        <div class="flex items-center gap-1">
          <StarIcon :size="14" class="text-yellow-400 fill-yellow-400" />
          <span class="font-bold text-[14px]">{{ avgRating.toFixed(1) }}</span>
          <span class="text-gray-600 text-[13px]">(+{{ reviews.length || 1000 }})</span>
        </div>
        <span v-for="(b,i) in (pdpMeta.badges||[])" :key="'bdg-top-'+i" class="inline-flex items-center px-2 py-0.5 text-white text-[11px] font-bold rounded" :style="b.bgColor ? ('background-color:'+b.bgColor) : 'background-color:#8a1538'">{{ b.title }}</span>
      </div>

      <h1 class="text-[13px] leading-relaxed text-gray-800 mb-3">
        {{ title }}
      </h1>

      <!-- Customer Images Badge -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="flex -space-x-2">
            <div v-for="i in 3" :key="i" class="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
              <img :src="images[i % images.length]" class="w-full h-full object-cover" loading="lazy" decoding="async" sizes="64px" />
      </div>
      </div>
          <span class="text-[12px] text-gray-600">في أصفر الزراء أنت قُم & كابتن</span>
      </div>
        <div class="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full">
          <span class="text-[11px] font-bold" v-if="pdpMeta.bestRank">#{{ pdpMeta.bestRank }} الأفضل مبيعاً</span>
          <Camera :size="14" />
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

      <!-- Size Selector (hidden when multi size-groups exist) -->
      <div ref="sizeSelectorRef" class="mb-4" v-if="sizeOptions.length && !sizeGroups.length">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-[14px]">مقاس - {{ size || 'الافتراضي' }}</span>
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

      <!-- Multi size-type selectors (length/width etc.) if available -->
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
            >
              {{ s }}
            </button>
          </div>
        </div>
      </div>
      </div>

      <!-- Fit Rating -->
      <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
        <div class="flex items-center gap-2 mb-2">
          <ThumbsUp :size="16" class="text-green-600" />
          <span class="font-bold text-[16px]">{{ pdpMeta.fitPercent ?? 96 }}%</span>
          <span class="text-[12px] text-gray-600">{{ pdpMeta.fitText || 'يعتقد من العملاء أن المقاس حقيقي ومناسب' }}</span>
          <ChevronLeft :size="16" class="text-gray-600 mr-auto" />
      </div>
        <div class="text-[12px] text-gray-600">
          ليس مقاسك؟ اختبرنا ما هو مقاسك ◀
        </div>
      </div>
    </div>
    <div ref="firstContainerEnd"></div>
    </div>

    <!-- White Container: Shipping Info -->
    <div class="bg-white px-4 mt-0.5">
      <!-- Shipping to destination -->
      <div class="mb-4">
        <div class="text-[16px] font-bold mb-3">الشحن الى {{ pdpMeta.shippingDestinationOverride || (product?.shippingCountry || 'السعودية') }}</div>
        
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div class="flex items-center gap-2">
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

        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <DollarSign :size="20" class="text-green-600" />
            <span class="text-[14px]">خدمة الدفع عند الاستلام</span>
          </div>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>

        <div class="flex items-center justify-between py-3 border-b border-gray-200">
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

        <div class="mt-3 p-3 bg-gray-50 rounded-lg">
          <div class="grid grid-cols-2 gap-2 text-[12px] text-gray-700">
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>طرق دفع آمنة</div>
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>شحن آمن</div>
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>حماية الخصوصية</div>
            <div class="flex items-center gap-1"><div class="w-1 h-1 rounded-full bg-green-600"></div>خدمة العملاء</div>
          </div>
      </div>

        <div class="flex items-center justify-between py-3">
        <div class="flex items-center gap-2">
            <Truck :size="20" class="text-green-600" />
            <span class="text-[13px]">الباع والشحن من: شي ان</span>
          </div>
          <ChevronLeft :size="16" class="text-gray-600" />
        </div>
        </div>
      </div>

    <!-- White Container: Products Section -->
    <div class="bg-white px-4 mt-0.5">
      <!-- Section 1: Products (Always Visible) -->
      <div ref="productsContentRef">
        <!-- Coupon Banner -->
        <div class="mb-4 p-3 bg-gradient-to-r from-pink-50 to-yellow-50 rounded-lg border border-pink-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-[13px]">مناسبة المطلة</span>
              <span v-for="(b,i) in (pdpMeta.badges||[])" :key="'bdg-fit-'+i" class="inline-flex items-center px-2 py-0.5 bg-purple-600 text-white text-[11px] font-bold rounded">{{ b.title }}</span>
              <span class="text-[11px] text-green-600 font-bold">⬇️ارتفاع14%</span>
          </div>
          </div>
          <div class="text-[12px] text-gray-600 mt-1">
            إطلالات عطلة ساحرة لك ولعائلتك لمغامرات منسمة!
        </div>
      </div>

        <!-- Description -->
        <div class="mb-4 pb-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-[15px]">وصف</span>
            <ChevronLeft :size="16" class="text-gray-600" />
          </div>
          <div class="prose prose-sm max-w-none text-gray-800" v-html="safeDescription"></div>
        </div>

        <!-- Model Reference -->
        <div class="mb-4 pb-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-[15px]">مرجع المقاس</span>
            <ChevronLeft :size="16" class="text-gray-600" />
          </div>
        </div>

        <!-- Model Measurements -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
            <div>
              <div class="text-[14px] font-bold mb-2">عارضة الأزياء ترتدي: {{ pdpMeta.model?.size || 'S' }}</div>
              <div class="text-[12px] text-gray-600">
                <span>طول: {{ pdpMeta.model?.height || 163 }}</span> | 
                <span>صدر: {{ pdpMeta.model?.bust || 88 }}</span> | 
                <span>خصر: {{ pdpMeta.model?.waist || 64 }}</span><br>
                <span>الوركين: {{ pdpMeta.model?.hips || 92 }}</span>
        </div>
            </div>
            <div class="w-12 h-12 rounded-full overflow-hidden">
              <img :src="images[0]" class="w-full h-full object-cover" />
            </div>
        </div>
      </div>

        <!-- Seller Info -->
        <div class="mb-4 p-4 border border-gray-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="font-bold text-[15px]">{{ brand || 'Elenzga' }}</span>
              <ChevronLeft :size="16" class="text-gray-600" />
            </div>
            <div class="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <span class="text-2xl">E</span>
            </div>
          </div>
          <div class="text-[11px] text-gray-600 mb-2">
            {{ sellerFollowText }}
          </div>
          <div class="flex gap-2 mb-3">
            <span v-for="(b,i) in (pdpMeta.badges||[])" :key="'bdg-seller-'+i" class="inline-flex items-center px-2 py-0.5 text-white text-[11px] font-bold rounded" :style="b.bgColor ? ('background-color:'+b.bgColor) : 'background-color:#8a1538'">{{ b.title }}</span>
          </div>
          <div class="text-[12px] text-gray-700 mb-3">
            {{ pdpMeta.sellerBlurb || '' }}
          </div>
          <div class="flex gap-2">
            <button class="flex-1 py-2 border border-gray-300 rounded-full text-[13px]">
              كل المنتجات
            </button>
            <button class="flex-1 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full text-[13px] font-bold">
              + متابع
            </button>
          </div>
        </div>
      </div>
      </div>

    <!-- White Container: Reviews Section -->
    <div class="bg-white px-4 mt-0.5">
      <!-- Section 2: Reviews (Always Visible) -->
      <div ref="reviewsContentRef" class="mt-8">
        <!-- Reviews Header -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <span class="font-bold text-[16px]">تعليقات(+1000)</span>
            <span class="text-[13px] text-gray-600 cursor-pointer">عرض الكل ◀</span>
      </div>

          <!-- Overall Rating -->
          <div class="text-center mb-4">
            <div class="flex justify-center mb-2">
              <StarIcon v-for="i in 5" :key="i" :size="20" class="text-yellow-400 fill-yellow-400" />
            </div>
            <div class="text-[32px] font-bold">{{ avgRating.toFixed(2) }}</div>
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
  </div>
</template>

<script setup lang="ts">
// ==================== IMPORTS ====================
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount, watch, nextTick } from 'vue'
import { useCart } from '@/store/cart'
import { API_BASE, apiPost, apiGet } from '@/lib/api'
import { 
  ShoppingCart, Share, Menu, 
  Star as StarIcon, Heart as HeartIcon,
  ChevronLeft, ChevronRight, Camera, ThumbsUp, Truck, DollarSign, 
  RotateCcw, ShieldCheck, ChevronUp, CheckCircle, Store
} from 'lucide-vue-next'

// ==================== ROUTE & ROUTER ====================
const route = useRoute()
const router = useRouter()
const id = route.query.id as string || 'p1'

// ==================== PRODUCT DATA ====================
const product = ref<any>(null)
const title = ref('منتج تجريبي')
const price = ref<number>(129)
const original = ref('')
const images = ref<string[]>([])
const activeIdx = ref(0)
const activeImg = computed(()=> images.value[activeIdx.value] || '')
const displayPrice = computed(()=> (Number(price.value)||0) + ' ر.س')
const categorySlug = ref<string>('')
const brand = ref<string>('')
const safeDescription = computed(()=>{
  try{
    const html = String(product.value?.description||'')
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,'')
  }catch{ return '' }
})

// ==================== PRODUCT VARIANTS ====================
// Color Variants
const colorVariants = ref<any[]>([])
const colorIdx = ref(0)

// Size Options
const sizeOptions = ref<string[]>([])
const size = ref<string>('')
// Multi-group sizes support
const sizeGroups = ref<Array<{ label: string; values: string[] }>>([])
const selectedGroupValues = ref<Record<string,string>>({})
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
  'احمر','أحمر','احمَر','أحمَر','red','ازرق','أزرق','azraq','blue','اخضر','أخضر','green','اصفر','أصفر','yellow','وردي','زهري','pink','اسود','أسود','black','ابيض','أبيض','white','بنفسجي','violet','purple','برتقالي','orange','بني','brown','رمادي','gray','grey','سماوي','turquoise','تركوازي','تركواز','بيج','beige','كحلي','navy','ذهبي','gold','فضي','silver'
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
  const t = normToken(s)
  if (!t) return false
  if (/^(xxs|xs|s|m|l|xl|xxl|xxxl)$/i.test(t)) return true
  if (/^(\d{2}|\d{1,3})$/.test(t)) return true
  // Arabic size words
  if (/^(صغير|وسط|متوسط|كبير|كبير جدا|فري|واحد|حر|طفل|للرضع|للنساء|للرجال|واسع|ضيّق)$/.test(t)) return true
  return false
}
// Split composite like "أحمر - M" or "Red / XL"
function splitTokens(s: string): string[] {
  return String(s||'')
    .split(/[,\/\-\|]+/)
    .map(x=>x.trim())
    .filter(Boolean)
}

// ==================== HEADER & NAVIGATION ====================
const showHeaderSearch = ref(false)
const showHeaderPrice = ref(false)
const showRecommendationStrip = ref(false)

// Refs for scroll calculations
const priceRef = ref<HTMLDivElement | null>(null)
const sizeSelectorRef = ref<HTMLDivElement | null>(null)
const firstContainerEnd = ref<HTMLDivElement | null>(null)

// Tabs
const tabs = ref([
  { key: 'products', label: 'سلع' },
  { key: 'reviews', label: 'تعليقات' },
  { key: 'recommendations', label: 'التوصية' }
])
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

// Cart & Wishlist
const cart = useCart()
const toast = ref(false)
const toastText = ref('تمت الإضافة إلى السلة')

async function addToCart(){
  const variantNote = size.value ? `(${size.value})` : ''
  cart.add({ id, title: title.value + variantNote, price: Number(price.value)||0, img: activeImg.value }, 1)
  try { await apiPost('/api/cart/add', { productId: id, variantId: selectedVariantId.value, quantity: 1 }) } catch {}
  try { trackAddToCart() } catch {}
  toast.value = true
  setTimeout(()=> toast.value=false, 1200)
}
const hasWish = ref(false)
// PDP Meta (badges, bestRank, fit, model, shipping destination override)
const pdpMeta = ref<{ badges?: Array<{ title:string; subtitle?:string; bgColor?:string }>; bestRank?: number|null; fitPercent?: number|null; fitText?: string|null; model?: { size?: string; height?: number; bust?: number; waist?: number; hips?: number }|null; shippingDestinationOverride?: string|null; sellerBlurb?: string|null }>({ badges: [] })
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
const seller = ref<{ id?: string; name?: string; storeName?: string; storeNumber?: string; updatedAt?: string }|null>(null)
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
  loadPdpMeta()
  loadSeller()
  trackViewItem()
  injectHeadMeta()
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
      if (imgs.length) { images.value = imgs; try { await nextTick(); await computeGalleryHeight() } catch {} }
      // defer color/size mapping to normalized loader
      original.value = ''
      categorySlug.value = String(d?.category?.slug||'')
      brand.value = String(d?.brand||'')
      
      // Sizes from API if available (accept only real size tokens)
  const s = Array.isArray(d.sizes) ? (d.sizes as any[]).filter((x:any)=> typeof x==='string' && looksSizeToken(String(x).trim()) && !isColorWord(String(x).trim())) : []
      if (s.length) {
        sizeOptions.value = s as string[]
        size.value = sizeOptions.value[0]
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
        if (!size.value && sizeOptions.value.length) size.value = sizeOptions.value[0]
      } catch {}
      
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
    }
  }catch{}
}

// ==================== VARIANTS (normalized API) ====================
async function loadNormalizedVariants(){
  // 1) Fetch normalized variants list
  const j = await apiGet<any>(`/api/product/${encodeURIComponent(id)}/variants`).catch(()=>null)
  let list: any[] = Array.isArray(j?.items) ? j!.items : []
  if (!list.length && Array.isArray(product.value?.variants)) list = product.value.variants as any[]

  // 2) Prefer grouped attributes from product endpoint to render buttons per group
  try {
    const pd = await apiGet<any>(`/api/product/${encodeURIComponent(id)}`).catch(()=>null)
    const attrs: Array<{ key:string; label:string; values:string[] }> = Array.isArray(pd?.attributes) ? pd!.attributes : []
    // Colors group
    const col = attrs.find(a=> a.key==='color')
    const colVals: string[] = Array.isArray(col?.values) ? col!.values : []
    // Map colors to images
    const imgs = images.value.slice()
    const pickImageFor = (c:string, idx:number): string => {
      const t = normToken(c)
      for (const u of imgs){ const file = u.split('/').pop() || ''; if (normToken(file).includes(t)) return u }
      return images.value[idx] || images.value[0] || ''
    }
    colorVariants.value = (colVals.length? colVals : ['—']).map((c, idx)=> ({ name: c, image: pickImageFor(c, idx), isHot: false }))
    if (colorVariants.value.length && (colorIdx.value < 0 || colorIdx.value >= colorVariants.value.length)) colorIdx.value = 0
    // Size groups
    const groups = attrs.filter(a=> a.key==='size')
    sizeGroups.value = groups.map(g=> ({ label: g.label || 'المقاس', values: Array.from(new Set(g.values||[])) }))
    if (sizeGroups.value.length){
      const init: Record<string,string> = {}
      for (const g of sizeGroups.value){ init[g.label] = g.values[0] }
      selectedGroupValues.value = init
    }
  } catch {}

  // 3) Derive fallback if attributes not present
  if (!colorVariants.value.length || !sizeGroups.value.length){
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
      colorVariants.value = (colors.length? colors : ['—']).map((c, idx)=> ({ name: c, image: pickImageFor(c, idx), isHot: false }))
      if (colorVariants.value.length && (colorIdx.value < 0 || colorIdx.value >= colorVariants.value.length)) colorIdx.value = 0
    }
    if (!sizeOptions.value.length){
      const sizesFromProduct = Array.isArray(product.value?.sizes) ? (product.value!.sizes as string[]) : []
      const sizesFromVariants = Array.from(sizeSet)
      const sizes = sizesFromProduct.length ? sizesFromProduct : sizesFromVariants
      sizeOptions.value = sizes.length ? sizes : []
      if (!size.value) size.value = sizeOptions.value[0] || ''
    }
  }

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
    const c = colorVariants.value[colorIdx.value]
    if (!c || !c.image) return
    const idx = images.value.findIndex(src => src === c.image)
    if (idx >= 0) activeIdx.value = idx
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
const shippingMethods = ref<Array<{ id:string; name:string; desc:string; price:number }>>([])
const shippingQuote = ref<number|undefined>(undefined)
const shippingTitleText = computed(()=>{
  const m = shippingMethods.value?.[0]
  if (!m) return 'شحن سريع'
  const priceNum = Number(m.price||0)
  const priceText = priceNum>0 ? `${priceNum} ر.س` : 'مجاني'
  return `${m.name} (${priceText})`
})
const shippingEtaText = computed(()=>{
  // Using quote or method desc
  if (shippingQuote.value!=null) return `التكلفة التقديرية: ${shippingQuote.value} ر.س`
  const m = shippingMethods.value?.[0]
  return m?.desc || 'شحن سريع التوصيل'
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
</style>
