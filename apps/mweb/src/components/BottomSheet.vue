<template>
  <teleport to="body">
    <div v-show="open" class="bs-overlay" @click.self="close" role="dialog" aria-modal="true">
      <div class="bs-panel" :style="panelStyle">
        <header class="bs-header">
          <slot name="header">
            <div class="bs-title">تصفية</div>
          </slot>
          <button class="bs-close" @click="close" aria-label="إغلاق">✕</button>
        </header>
        <div class="bs-content">
          <slot />
        </div>
        <footer class="bs-footer">
          <slot name="footer">
            <button class="bs-btn primary" @click="apply">تطبيق</button>
          </slot>
        </footer>
      </div>
    </div>
  </teleport>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ modelValue: boolean; height?: string }>(), { height: '70vh' })
const emit = defineEmits<{ (e:'update:modelValue', v:boolean):void; (e:'apply'):void }>()
const open = computed(()=> props.modelValue)
function close(){ emit('update:modelValue', false) }
function apply(){ emit('apply'); close() }
const panelStyle = computed(()=> ({ height: props.height }))
</script>

<style scoped>
.bs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.42);display:grid;align-items:end;z-index:60}
.bs-panel{background:#fff;border-top-left-radius:16px;border-top-right-radius:16px;box-shadow:0 -8px 24px rgba(0,0,0,.18);display:grid;grid-template-rows:auto 1fr auto;max-height:90vh}
.bs-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--muted-2,#eee)}
.bs-title{font-weight:700}
.bs-close{appearance:none;border:0;background:transparent;font-size:18px;cursor:pointer}
.bs-content{padding:8px 16px;overflow:auto}
.bs-footer{padding:12px 16px;border-top:1px solid var(--muted-2,#eee);display:flex;gap:8px}
.bs-btn{flex:1;appearance:none;border:1px solid #ddd;background:#fff;border-radius:12px;padding:12px;font-weight:700}
.bs-btn.primary{background:#0B5FFF;color:#fff;border-color:#0B5FFF}
</style>

