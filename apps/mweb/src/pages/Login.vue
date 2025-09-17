<template>
  <div class="container">
    <div class="card" style="margin-top:24px">
      <h2 style="margin:0 0 12px 0">تسجيل الدخول</h2>
      <form @submit.prevent="login">
        <div style="display:grid;gap:12px">
          <input v-model="email" class="input" placeholder="البريد الإلكتروني" />
          <input v-model="password" class="input" type="password" placeholder="كلمة المرور" />
          <button class="btn" type="submit">دخول</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const email = ref('');
const password = ref('');
async function login(){
  // TODO: wire to API
  alert('تم');
}
</script>

