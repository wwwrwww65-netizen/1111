<template>
  <section class="card" dir="rtl">
    <div class="row">
      <img class="avatar" :src="avatar" alt="صورة الملف الشخصي" loading="lazy" />
      <div class="info">
        <div class="name">{{ username }}</div>
        <a href="/profile" role="link" class="link" aria-label="ملفي الشخصي">ملفي الشخصي</a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ username?: string; avatar?: string }>()
const username = props.username || 'اسم المستخدم'
const avatar = props.avatar || 'https://i.pravatar.cc/100'
</script>

<style scoped>
.row{display:flex;gap:12px;align-items:center}
.avatar{width:56px;height:56px;border-radius:999px;object-fit:cover;border:1px solid var(--muted-2,#eee)}
.name{font-size:16px;font-weight:700}
.link{font-size:12px;color:var(--subtle,#666);text-decoration:none}
</style>

