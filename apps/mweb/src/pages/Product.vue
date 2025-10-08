<template>
  <div class="bg-gray-50 min-h-screen pb-20" dir="rtl">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div class="flex items-center justify-between px-4 py-3 h-14">
        <div class="flex items-center gap-3">
          <button class="w-8 h-8 flex items-center justify-center relative" @click="router.push('/cart')">
            <ShoppingCart :size="22" class="text-gray-800" />
            <span v-if="cart.count" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[11px] px-1 font-bold">{{ cart.count }}</span>
          </button>
          <button class="w-8 h-8 flex items-center justify-center" @click="share">
            <Share2 :size="22" class="text-gray-800" />
          </button>
          <button class="w-8 h-8 flex items-center justify-center" @click="router.push('/search')">
            <Search :size="22" class="text-gray-800" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button @click="router.back()" class="w-8 h-8 flex items-center justify-center">
            <ChevronRight :size="24" class="text-gray-800" />
          </button>
        </div>
      </div>
    </div>

    <!-- Product Image Gallery -->
    <div class="relative mt-14 bg-white">
      <div ref="galleryRef" class="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide" @scroll.passive="onGalleryScroll">
        <div class="flex">
          <div v-for="(img,idx) in images" :key="'img-'+idx" class="w-full flex-shrink-0 snap-start relative">
            <img :src="img" :alt="title" class="w-full h-auto object-cover block" loading="lazy" />
          </div>
        </div>
      </div>
      
      <!-- Image Counter -->
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-[13px] font-medium">
        {{ activeIdx + 1 }}/{{ images.length }}
      </div>
      
      <!--Wishlist Badge -->
      <button @click="toggleWish" class="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
        <Heart :size="20" :class="hasWish ? 'text-red-500 fill-red-500' : 'text-gray-600'" />
      </button>

      <!-- Gallery Dots -->
      <div class="flex justify-center gap-1.5 py-3 bg-white">
        <div v-for="(img, i) in images" :key="'dot-'+i" 
             class="h-1.5 rounded-full transition-all"
             :class="i === activeIdx ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-300'">
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-3">
      <!-- Price Section -->
      <div class="bg-white px-4 py-4">
        <div class="flex items-baseline gap-2 mb-2">
          <span class="text-[28px] font-bold text-red-600">{{ displayPrice }} ر.س</span>
          <span v-if="originalPrice" class="text-[16px] text-gray-400 line-through">{{ originalPrice }} ر.س</span>
          <span v-if="originalPrice" class="bg-red-100 text-red-600 text-[12px] px-2 py-0.5 rounded font-bold">
            -{{ Math.round((1 - price/parseFloat(originalPrice)) * 100) }}%
          </span>
        </div>

        <!-- SHEIN CLUB Offer -->
        <div class="bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-2.5 rounded-lg mb-3 border border-orange-200">
          <div class="flex items-center gap-2">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded px-1.5 py-0.5 text-[11px] font-bold">S</div>
            <span class="text-[13px] text-orange-800 font-medium">وفر {{ clubSave.toFixed(2) }} ر.س مع SHEIN CLUB</span>
          </div>
        </div>

        <!-- Flash Sale Timer -->
        <div v-if="showFlashSale" class="bg-gradient-to-r from-red-500 to-pink-500 px-3 py-2.5 rounded-lg flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Zap :size="16" class="text-white" />
            <span class="text-white text-[13px] font-bold">عرض محدود</span>
          </div>
          <div class="flex items-center gap-1 text-white">
            <div class="bg-white/20 px-2 py-1 rounded text-[13px] font-bold">{{ hours }}</div>
            <span class="text-[13px]">:</span>
            <div class="bg-white/20 px-2 py-1 rounded text-[13px] font-bold">{{ minutes }}</div>
            <span class="text-[13px]">:</span>
            <div class="bg-white/20 px-2 py-1 rounded text-[13px] font-bold">{{ seconds }}</div>
          </div>
        </div>
      </div>

      <!-- Product Title & Rating -->
      <div class="bg-white px-4 py-4">
        <h1 class="text-[17px] font-semibold leading-snug text-gray-900 mb-3">{{ title }}</h1>
        
        <!-- Rating -->
        <div class="flex items-center gap-3 mb-3">
          <div class="flex items-center gap-1.5">
            <Star v-for="i in 5" :key="i" :size="16" :class="i <= Math.floor(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" />
          </div>
          <span class="text-[15px] font-bold text-gray-900">{{ avgRating.toFixed(1) }}</span>
          <button @click="scrollToReviews" class="text-[13px] text-gray-500 underline">({{ reviewsCount }}+ تقييم)</button>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-2">
          <span class="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[12px] font-medium">#5 الأفضل مبيعاً</span>
          <span class="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[12px] font-medium">ترندات</span>
          <span class="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[12px] font-medium">توصيل سريع</span>
        </div>
      </div>

      <!-- Coupons Section -->
      <div class="bg-white px-4 py-4" v-if="coupons.length">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Ticket :size="18" class="text-red-500" />
            <span class="text-[15px] font-bold text-gray-900">كوبونات متاحة</span>
          </div>
          <button class="text-[13px] text-blue-600">عرض الكل</button>
        </div>
        <div class="space-y-2">
          <div v-for="(coupon, i) in coupons.slice(0, 2)" :key="i" 
               class="border-2 border-dashed border-red-300 rounded-lg p-3 flex items-center justify-between bg-red-50">
            <div>
              <div class="text-[14px] font-bold text-red-600 mb-1">{{ coupon.title }}</div>
              <div class="text-[12px] text-gray-600">{{ coupon.desc }}</div>
            </div>
            <button class="bg-red-500 text-white px-4 py-1.5 rounded-full text-[12px] font-bold hover:bg-red-600 transition">
              احصل عليه
            </button>
          </div>
        </div>
      </div>

      <!-- Color Selection -->
      <div class="bg-white px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[15px] font-bold text-gray-900">اللون: <span class="font-normal text-gray-700">{{ selectedColor }}</span></span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="(color, i) in colors" :key="i"
                  @click="selectColor(i)"
                  class="relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                  :class="selectedColorIdx === i ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'border-gray-200'">
            <div class="w-full h-full" :style="{ backgroundColor: color.hex }"></div>
            <Check v-if="selectedColorIdx === i" :size="16" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
          </button>
        </div>
      </div>

      <!-- Size Selection -->
      <div class="bg-white px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[15px] font-bold text-gray-900">المقاس: <span class="font-normal text-gray-700">{{ selectedSize }}</span></span>
          <button @click="showSizeGuide = true" class="flex items-center gap-1 text-blue-600 text-[13px] font-medium">
            <Ruler :size="14" />
            <span>دليل المقاسات</span>
          </button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button v-for="size in sizes" :key="size"
                  @click="selectedSize = size"
                  class="h-11 rounded-lg border-2 text-[14px] font-medium transition-all"
                  :class="selectedSize === size 
                    ? 'border-gray-900 bg-gray-900 text-white' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'">
            {{ size }}
          </button>
        </div>
        
        <!-- Size Recommendation -->
        <div class="mt-3 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2">
          <Info :size="16" class="text-blue-600 mt-0.5 flex-shrink-0" />
          <div class="text-[12px] text-blue-800">
            <div class="font-bold mb-1">نصيحة المقاس</div>
            <div>{{ sizeFitPercentage }}% من العملاء اختاروا مقاسهم المعتاد</div>
          </div>
        </div>
      </div>

      <!-- Quantity -->
      <div class="bg-white px-4 py-4">
        <div class="text-[15px] font-bold text-gray-900 mb-3">الكمية</div>
        <div class="flex items-center gap-3">
          <button @click="decreaseQty" 
                  class="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50"
                  :disabled="quantity <= 1">
            <Minus :size="18" />
          </button>
          <div class="flex-1 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-[15px] font-bold">
            {{ quantity }}
          </div>
          <button @click="increaseQty" 
                  class="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50">
            <Plus :size="18" />
          </button>
          <div class="text-[13px] text-gray-500">متوفر: {{ stock }} قطعة</div>
        </div>
      </div>

      <!-- Shipping & Delivery -->
      <div class="bg-white px-4 py-4">
        <div class="flex items-center gap-2 mb-3">
          <Truck :size="18" class="text-gray-700" />
          <span class="text-[15px] font-bold text-gray-900">التوصيل والشحن</span>
        </div>
        
        <div class="space-y-3">
          <!-- Location -->
          <div class="flex items-start gap-3 pb-3 border-b border-gray-100">
            <MapPin :size="16" class="text-gray-500 mt-0.5 flex-shrink-0" />
            <div class="flex-1">
              <div class="text-[13px] text-gray-600 mb-1">التوصيل إلى</div>
              <div class="flex items-center justify-between">
                <span class="text-[14px] font-medium text-gray-900">{{ shippingLocation }}</span>
                <button class="text-blue-600 text-[13px] font-medium">تغيير</button>
              </div>
            </div>
          </div>

          <!-- Delivery Date -->
          <div class="flex items-start gap-3 pb-3 border-b border-gray-100">
            <Calendar :size="16" class="text-gray-500 mt-0.5 flex-shrink-0" />
            <div class="flex-1">
              <div class="text-[13px] text-gray-600 mb-1">تاريخ التوصيل المتوقع</div>
              <div class="text-[14px] font-medium text-gray-900">{{ deliveryDate }}</div>
            </div>
          </div>

          <!-- Shipping Cost -->
          <div class="flex items-start gap-3">
            <Package :size="16" class="text-gray-500 mt-0.5 flex-shrink-0" />
            <div class="flex-1">
              <div class="text-[13px] text-gray-600 mb-1">تكلفة الشحن</div>
              <div class="text-[14px] font-medium text-green-600">شحن مجاني للطلبات فوق {{ freeShippingThreshold }} ر.س</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Details -->
      <div class="bg-white px-4 py-4">
        <button @click="showDetails = !showDetails" class="w-full flex items-center justify-between mb-3">
          <span class="text-[15px] font-bold text-gray-900">تفاصيل المنتج</span>
          <ChevronDown :size="20" :class="showDetails ? 'rotate-180' : ''" class="transition-transform text-gray-600" />
        </button>
        
        <div v-if="showDetails" class="space-y-2 text-[14px]">
          <div class="grid grid-cols-[100px_1fr] gap-3 py-2 border-b border-gray-100">
            <span class="text-gray-600">المادة</span>
            <span class="text-gray-900 font-medium">100% قطن</span>
          </div>
          <div class="grid grid-cols-[100px_1fr] gap-3 py-2 border-b border-gray-100">
            <span class="text-gray-600">النمط</span>
            <span class="text-gray-900 font-medium">لون سادة</span>
          </div>
          <div class="grid grid-cols-[100px_1fr] gap-3 py-2 border-b border-gray-100">
            <span class="text-gray-600">نوع الأكمام</span>
            <span class="text-gray-900 font-medium">أكمام قصيرة</span>
          </div>
          <div class="grid grid-cols-[100px_1fr] gap-3 py-2 border-b border-gray-100">
            <span class="text-gray-600">المناسبة</span>
            <span class="text-gray-900 font-medium">كاجوال، يومي</span>
          </div>
          <div class="grid grid-cols-[100px_1fr] gap-3 py-2 border-b border-gray-100">
            <span class="text-gray-600">الموسم</span>
            <span class="text-gray-900 font-medium">صيف، ربيع</span>
          </div>
          <div class="grid grid-cols-[100px_1fr] gap-3 py-2">
            <span class="text-gray-600">العناية</span>
            <span class="text-gray-900 font-medium">غسيل آلي، لا تبييض</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="bg-white px-4 py-4">
        <button @click="showDescription = !showDescription" class="w-full flex items-center justify-between mb-3">
          <span class="text-[15px] font-bold text-gray-900">الوصف</span>
          <ChevronDown :size="20" :class="showDescription ? 'rotate-180' : ''" class="transition-transform text-gray-600" />
        </button>
        
        <div v-if="showDescription" class="text-[14px] text-gray-700 leading-relaxed space-y-3">
          <p>قميص كاجوال أنيق مناسب للارتداء اليومي وفي المناسبات الصيفية. مصنوع من قطن عالي الجودة يوفر راحة فائقة طوال اليوم.</p>
          <p>التصميم البسيط والعصري يجعله قطعة أساسية في خزانة ملابسك. يمكن تنسيقه مع الجينز أو البنطلونات الكاجوال.</p>
          
          <div class="bg-gray-50 p-3 rounded-lg mt-4">
            <div class="text-[13px] font-bold text-gray-900 mb-2">معلومات المانيكان:</div>
            <div class="text-[13px] text-gray-600">{{ modelMeasurements }}</div>
            <div class="text-[13px] text-gray-600 mt-1">المانيكان ترتدي المقاس: {{ modelSize }}</div>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div ref="reviewsSection" class="bg-white px-4 py-4">
        <div class="flex items-center justify-between mb-4">
          <span class="text-[17px] font-bold text-gray-900">التقييمات ({{ reviewsCount }})</span>
          <button class="text-blue-600 text-[13px] font-medium">عرض الكل</button>
        </div>

        <!-- Rating Summary -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-center">
              <div class="text-[36px] font-bold text-gray-900">{{ avgRating.toFixed(1) }}</div>
              <div class="flex items-center justify-center gap-0.5 mb-1">
                <Star v-for="i in 5" :key="i" :size="14" :class="i <= Math.floor(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" />
              </div>
              <div class="text-[12px] text-gray-500">{{ reviewsCount }} تقييم</div>
            </div>
            
            <div class="flex-1 space-y-2">
              <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-2">
                <div class="flex items-center gap-1">
                  <Star :size="12" class="text-yellow-400 fill-yellow-400" />
                  <span class="text-[12px] text-gray-600 w-3">{{ star }}</span>
                </div>
                <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-yellow-400" :style="{ width: getStarPercentage(star) + '%' }"></div>
                </div>
                <span class="text-[11px] text-gray-500 w-8 text-right">{{ getStarPercentage(star) }}%</span>
              </div>
            </div>
          </div>

          <!-- Customer Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-lg p-3 text-center">
              <div class="text-[14px] font-bold text-gray-900">{{ sizeFitPercentage }}%</div>
              <div class="text-[11px] text-gray-600">مقاس مناسب</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center">
              <div class="text-[14px] font-bold text-gray-900">{{ wouldBuyAgain }}%</div>
              <div class="text-[11px] text-gray-600">سيشترون مرة أخرى</div>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="space-y-4">
          <div v-for="review in reviews.slice(0, 3)" :key="review.id" class="border-b border-gray-100 pb-4 last:border-0">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-[13px] font-bold">
                  {{ review.user.charAt(0) }}
                </div>
                <div>
                  <div class="text-[13px] font-medium text-gray-900">{{ review.user }}</div>
                  <div class="text-[11px] text-gray-500">{{ review.date }}</div>
                </div>
              </div>
              <div class="flex items-center gap-0.5">
                <Star v-for="i in 5" :key="i" :size="12" :class="i <= review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'" />
              </div>
            </div>
            
            <p class="text-[14px] text-gray-700 leading-relaxed mb-2">{{ review.comment }}</p>
            
            <div class="text-[12px] text-gray-500 mb-2">{{ review.colorSize }}</div>
            
            <button class="flex items-center gap-1 text-[12px] text-gray-600">
              <ThumbsUp :size="14" />
              <span>مفيد ({{ review.helpful }})</span>
            </button>
          </div>
        </div>

        <button class="w-full mt-4 py-3 border-2 border-gray-300 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition">
          عرض جميع التقييمات ({{ reviewsCount }})
        </button>
      </div>

      <!-- Similar Products -->
      <div class="bg-white px-4 py-4">
        <div class="text-[17px] font-bold text-gray-900 mb-4">منتجات مشابهة</div>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="product in relatedProducts" :key="product.id" class="border border-gray-200 rounded-lg overflow-hidden">
            <img :src="product.image" :alt="product.name" class="w-full aspect-square object-cover" />
            <div class="p-2">
              <div class="text-[13px] font-medium text-gray-900 mb-1 line-clamp-2">{{ product.name }}</div>
              <div class="text-[15px] font-bold text-gray-900 mb-1">{{ product.price }} ر.س</div>
              <div class="flex items-center gap-1">
                <Star :size="12" class="text-yellow-400 fill-yellow-400" />
                <span class="text-[11px] text-gray-600">({{ product.reviews }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="bg-white px-4 py-4">
        <div class="text-[17px] font-bold text-gray-900 mb-4">أسئلة شائعة</div>
        <div class="space-y-3">
          <div v-for="(faq, i) in faqs" :key="i" class="border-b border-gray-100 pb-3 last:border-0">
            <button @click="toggleFaq(i)" class="w-full flex items-start justify-between gap-3 text-right">
              <span class="text-[14px] font-medium text-gray-900">{{ faq.q }}</span>
              <ChevronDown :size="18" :class="faq.open ? 'rotate-180' : ''" class="transition-transform text-gray-600 flex-shrink-0 mt-0.5" />
            </button>
            <div v-if="faq.open" class="text-[13px] text-gray-600 mt-2 leading-relaxed">{{ faq.a }}</div>
          </div>
        </div>
      </div>

      <!-- Trust Badges -->
      <div class="bg-white px-4 py-4">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="space-y-2">
            <div class="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck :size="24" class="text-green-600" />
            </div>
            <div class="text-[11px] text-gray-600">ضمان الجودة</div>
          </div>
          <div class="space-y-2">
            <div class="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
              <RotateCcw :size="24" class="text-blue-600" />
            </div>
            <div class="text-[11px] text-gray-600">إرجاع مجاني</div>
          </div>
          <div class="space-y-2">
            <div class="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
              <Lock :size="24" class="text-purple-600" />
            </div>
            <div class="text-[11px] text-gray-600">دفع آمن</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center gap-2 pb-safe z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
      <button @click="router.push('/cart')" class="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center relative hover:bg-gray-50 transition">
        <ShoppingCart :size="22" class="text-gray-700" />
        <span v-if="cart.count" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[11px] px-1 font-bold">{{ cart.count }}</span>
      </button>
      <button @click="buyNow" class="flex-1 h-12 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-[15px] hover:from-orange-600 hover:to-orange-700 transition shadow-md">
        اشتر الآن
      </button>
      <button @click="addToCart" class="flex-1 h-12 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold text-[15px] hover:from-black hover:to-gray-900 transition shadow-md">
        أضف للسلة
      </button>
    </div>

    <!-- Size Guide Modal -->
    <div v-if="showSizeGuide" @click="showSizeGuide = false" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div @click.stop class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <span class="text-[17px] font-bold text-gray-900">دليل المقاسات</span>
          <button @click="showSizeGuide = false" class="w-8 h-8 flex items-center justify-center">
            <X :size="24" class="text-gray-600" />
          </button>
        </div>
        
        <div class="p-4">
          <div class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-3 py-2 text-right font-medium text-gray-900">المقاس</th>
                  <th class="px-3 py-2 text-center font-medium text-gray-900">الصدر (سم)</th>
                  <th class="px-3 py-2 text-center font-medium text-gray-900">الطول (سم)</th>
                  <th class="px-3 py-2 text-center font-medium text-gray-900">الأكمام (سم)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="size in sizeChart" :key="size.size" class="border-b border-gray-100">
                  <td class="px-3 py-3 font-medium text-gray-900">{{ size.size }}</td>
                  <td class="px-3 py-3 text-center text-gray-600">{{ size.bust }}</td>
                  <td class="px-3 py-3 text-center text-gray-600">{{ size.length }}</td>
                  <td class="px-3 py-3 text-center text-gray-600">{{ size.sleeve }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="mt-4 bg-blue-50 p-3 rounded-lg">
            <div class="text-[13px] text-blue-900 font-bold mb-2">نصائح القياس:</div>
            <ul class="text-[12px] text-blue-800 space-y-1">
              <li>• استخدم شريط قياس مرن</li>
              <li>• قس على الجسم مباشرة وليس فوق الملابس</li>
              <li>• إذا كانت قياساتك بين مقاسين، اختر الأكبر</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast" class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2">
        <CheckCircle :size="18" class="text-green-400" />
        <span class="text-[14px] font-medium">{{ toastText }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useCart } from '@/store/cart'
import { API_BASE } from '@/lib/api'
import { 
  ShoppingCart, Share2, Search, Heart, Star, ChevronRight, ChevronDown, 
  Truck, MapPin, Calendar, Package, Info, Ruler, Check, Minus, Plus,
  Ticket, Zap, ThumbsUp, ShieldCheck, RotateCcw, Lock, X, CheckCircle
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.query.id as string || route.params.id as string || 'p1')

// Product Data
const title = ref('ترندات COSMINA ملابس علوية كاجوال بأكمام قصيرة بلون سادة للسيدات')
const price = ref<number>(27.00)
const originalPrice = ref('35.00')
const images = ref<string[]>([
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop'
])

// Gallery
const activeIdx = ref(0)
const galleryRef = ref<HTMLDivElement|null>(null)

// Product Options
const colors = ref([
  { name: 'أسود', hex: '#000000' },
  { name: 'أبيض', hex: '#FFFFFF' },
  { name: 'بيج', hex: '#F5F5DC' },
  { name: 'كحلي', hex: '#000080' }
])
const selectedColorIdx = ref(0)
const selectedColor = computed(() => colors.value[selectedColorIdx.value].name)

const sizes = ref(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
const selectedSize = ref('M')
const quantity = ref(1)
const stock = ref(156)

// Size Chart
const sizeChart = ref([
  { size: 'XS', bust: '84', length: '62', sleeve: '15' },
  { size: 'S', bust: '88', length: '64', sleeve: '16' },
  { size: 'M', bust: '92', length: '66', sleeve: '17' },
  { size: 'L', bust: '96', length: '68', sleeve: '18' },
  { size: 'XL', bust: '100', length: '70', sleeve: '19' },
  { size: 'XXL', bust: '104', length: '72', sleeve: '20' }
])

// Reviews & Ratings
const avgRating = ref(4.9)
const reviewsCount = ref(1247)
const sizeFitPercentage = ref(95)
const wouldBuyAgain = ref(93)

const reviews = ref([
  { 
    id: 1, 
    user: 'سارة أ***', 
    stars: 5, 
    comment: 'قميص رائع جداً، مريح ومناسب للصيف. الجودة ممتازة والمقاس مناسب تماماً. أنصح به بشدة!', 
    date: 'منذ يومين',
    colorSize: 'لون: أسود، مقاس: M',
    helpful: 24
  },
  { 
    id: 2, 
    user: 'فاطمة م***', 
    stars: 5, 
    comment: 'التصميم بسيط وأنيق، القماش خفيف ومناسب للطقس الحار. وصل بسرعة والتغليف ممتاز.', 
    date: 'منذ 3 أيام',
    colorSize: 'لون: أبيض، مقاس: L',
    helpful: 18
  },
  { 
    id: 3, 
    user: 'نورة ع***', 
    stars: 4, 
    comment: 'جميل جداً وسعره مناسب. المقاس صحيح كما في الجدول. الوحيد هو أنه يحتاج كي بعد الغسيل.', 
    date: 'منذ أسبوع',
    colorSize: 'لون: بيج، مقاس: S',
    helpful: 12
  }
])

// Coupons
const coupons = ref([
  { title: 'خصم 15 ر.س', desc: 'للطلبات فوق 150 ر.س', code: 'SAVE15' },
  { title: 'خصم 30 ر.س', desc: 'للطلبات فوق 300 ر.س', code: 'SAVE30' },
  { title: 'خصم 10%', desc: 'على أول طلب', code: 'FIRST10' }
])

// Shipping
const shippingLocation = ref('الرياض، السعودية')
const freeShippingThreshold = ref('99.00')
const deliveryDate = ref('12 - 15 نوفمبر')

// SHEIN CLUB
const clubSave = ref(1.35)

// Model Info
const modelSize = ref('M')
const modelMeasurements = ref('طول: 175سم | صدر: 84سم | خصر: 62سم | ورك: 91سم')

// Related Products
const relatedProducts = ref([
  {
    id: 1,
    name: 'قميص كاجوال بأكمام طويلة',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
    price: '32.50',
    reviews: 543
  },
  {
    id: 2,
    name: 'بلوزة صيفية بلون سادة',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=300&fit=crop',
    price: '28.90',
    reviews: 892
  },
  {
    id: 3,
    name: 'تيشرت كاجوال قطن',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&h=300&fit=crop',
    price: '24.00',
    reviews: 1205
  },
  {
    id: 4,
    name: 'قميص عصري بتصميم فريد',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    price: '35.70',
    reviews: 678
  }
])

// FAQs
const faqs = ref([
  { q: 'ما هي سياسة الإرجاع؟', a: 'يمكنك إرجاع المنتج خلال 30 يوم من تاريخ الاستلام بشرط أن يكون بحالته الأصلية.', open: false },
  { q: 'كم تستغرق مدة التوصيل؟', a: 'عادة يتم التوصيل خلال 3-5 أيام عمل داخل المملكة العربية السعودية.', open: false },
  { q: 'هل المنتج مطابق للصور؟', a: 'نعم، جميع صورنا حقيقية للمنتج. قد يختلف اللون قليلاً حسب إعدادات شاشتك.', open: false },
  { q: 'كيف أعرف مقاسي المناسب؟', a: 'يرجى مراجعة دليل المقاسات أعلاه. ننصح بأخذ قياساتك ومقارنتها بالجدول.', open: false }
])

// UI State
const showSizeGuide = ref(false)
const showDetails = ref(false)
const showDescription = ref(false)
const hasWish = ref(false)
const toast = ref(false)
const toastText = ref('')
const reviewsSection = ref<HTMLDivElement|null>(null)

// Flash Sale Timer
const showFlashSale = ref(true)
const hours = ref('02')
const minutes = ref('45')
const seconds = ref('30')

// Computed
const displayPrice = computed(() => price.value.toFixed(2))
const cart = useCart()

// Functions
function selectColor(i: number) {
  selectedColorIdx.value = i
}

function increaseQty() {
  if (quantity.value < stock.value) quantity.value++
}

function decreaseQty() {
  if (quantity.value > 1) quantity.value--
}

function scrollToIdx(i: number) {
  activeIdx.value = i
  const el = galleryRef.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}

function onGalleryScroll() {
  const el = galleryRef.value
  if (!el) return
  const i = Math.round(el.scrollLeft / el.clientWidth)
  if (i !== activeIdx.value) activeIdx.value = i
}

function getStarPercentage(star: number): number {
  const percentages = { 5: 75, 4: 15, 3: 6, 2: 3, 1: 1 }
  return percentages[star as keyof typeof percentages] || 0
}

function toggleFaq(i: number) {
  faqs.value[i].open = !faqs.value[i].open
}

function scrollToReviews() {
  reviewsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function addToCart() {
  cart.add({ 
    id: id.value, 
    title: title.value, 
    price: Number(price.value) || 0, 
    img: images.value[0] 
  }, quantity.value)
  
  toastText.value = 'تمت الإضافة إلى السلة بنجاح'
  toast.value = true
  setTimeout(() => toast.value = false, 2500)
}

function buyNow() {
  addToCart()
  setTimeout(() => {
    router.push('/cart')
  }, 300)
}

function toggleWish() {
  hasWish.value = !hasWish.value
  if (hasWish.value) {
    toastText.value = 'تمت الإضافة إلى المفضلة'
    toast.value = true
    setTimeout(() => toast.value = false, 2000)
  }
}

async function share() {
  try {
    const data = { 
      title: title.value, 
      text: title.value, 
      url: location.href 
    }
    if ((navigator as any).share) {
      await (navigator as any).share(data)
    } else {
      await navigator.clipboard.writeText(location.href)
      toastText.value = 'تم نسخ الرابط'
      toast.value = true
      setTimeout(() => toast.value = false, 2000)
    }
  } catch {}
}

// Timer
let timerInterval: any
function startTimer() {
  timerInterval = setInterval(() => {
    let s = parseInt(seconds.value)
    let m = parseInt(minutes.value)
    let h = parseInt(hours.value)
    
    s--
    if (s < 0) {
      s = 59
      m--
    }
    if (m < 0) {
      m = 59
      h--
    }
    if (h < 0) {
      showFlashSale.value = false
      clearInterval(timerInterval)
      return
    }
    
    seconds.value = s.toString().padStart(2, '0')
    minutes.value = m.toString().padStart(2, '0')
    hours.value = h.toString().padStart(2, '0')
  }, 1000)
}

// Lifecycle
onMounted(async () => {
  startTimer()
  
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id.value)}`, { 
      credentials: 'include'
    })
    if (res.ok) {
      const d = await res.json()
      if (d.name) title.value = d.name
      if (d.price) price.value = Number(d.price)
      if (d.images?.length) images.value = d.images
    }
  } catch (e) {
    console.error('Failed to load product:', e)
  }
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, 10px);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
