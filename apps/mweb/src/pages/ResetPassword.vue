<template>
  <div class="min-h-screen bg-white flex flex-col" dir="rtl">
    <!-- Header -->
    <header class="w-full py-4 flex items-center justify-between px-6">
      <button aria-label="رجوع" @click="goBack" class="p-2 -mr-2 rounded-full hover:bg-gray-50 transition-colors">
        <ArrowRight class="w-6 h-6 text-gray-800" />
      </button>
      <div class="w-10"></div>
    </header>

    <main class="flex-1 max-w-md mx-auto px-6 w-full flex flex-col pt-4">
      <!-- Title Section -->
      <div class="mb-8 animate-fadeIn">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">تعيين كلمة المرور 🔒</h1>
        <p class="text-[15px] text-gray-500 leading-relaxed">
          الرجاء إدخال كلمة المرور الجديدة لحماية حسابك
        </p>
      </div>

      <!-- Form Fields -->
      <div class="space-y-6 animate-slideUp">
        <!-- New Password -->
        <div class="space-y-2">
          <label class="block text-[13px] font-medium text-gray-700">كلمة المرور الجديدة</label>
          <div class="relative group">
            <input 
              v-model="newPassword" 
              :type="showNewPassword ? 'text' : 'password'"
              class="w-full h-14 px-4 rounded-[12px] border border-gray-200 bg-gray-50 text-right text-[16px] transition-all duration-200 focus:bg-white focus:border-[#8a1538] focus:ring-4 focus:ring-[#8a1538]/5 outline-none placeholder:text-gray-400"
              placeholder="أدخل كلمة المرور الجديدة"
              autofocus
            />
            <button 
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <Eye v-if="!showNewPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-2">
          <label class="block text-[13px] font-medium text-gray-700">تأكيد كلمة المرور</label>
          <div class="relative group">
            <input 
              v-model="confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'"
              class="w-full h-14 px-4 rounded-[12px] border border-gray-200 bg-gray-50 text-right text-[16px] transition-all duration-200 focus:bg-white focus:border-[#8a1538] focus:ring-4 focus:ring-[#8a1538]/5 outline-none placeholder:text-gray-400"
              placeholder="أعد إدخال كلمة المرور"
              @keyup.enter="submit"
            />
            <button 
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>

          <div v-if="errorMessage" class="flex items-start gap-2 text-red-500 text-[13px] bg-red-50 p-3 rounded-[8px] animate-shake">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          @click="submit" 
          :disabled="loading || !isValid"
          class="w-full h-14 rounded-[12px] text-white font-bold text-[16px] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#8a1538]/20 hover:shadow-[#8a1538]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none bg-[#8a1538]"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>حفظ كلمة المرور</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const primary = '#8a1538'

const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const isValid = computed(() => {
  return newPassword.value.length >= 8 && newPassword.value === confirmPassword.value
})

function goBack() {
  router.back()
}

async function submit() {
  if (!isValid.value) return
  
  if (newPassword.value.length < 8) {
    errorMessage.value = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'كلمتا المرور غير متطابقتين'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch('/trpc/auth.setPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPassword.value })
    })
    
    const text = await res.text()
    let data: any = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error('Failed to parse response:', text)
      throw new Error('خطأ في الاتصال: استجابة غير صالحة')
    }

    if (!res.ok) {
      throw new Error(data.error?.message || 'فشل تعيين كلمة المرور')
    }

    // Success
    router.replace('/account')
  } catch (e: any) {
    console.error(e)
    errorMessage.value = e.message || 'خطأ في الاتصال'
  } finally {
    loading.value = false
  }
}
</script>
