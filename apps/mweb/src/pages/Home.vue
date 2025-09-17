<template>
  <div class="container">
    <section class="hero">
      <div class="hero-text">
        <h1>مرحبا بك في jeeey</h1>
        <p>تسوق أحدث المنتجات والعروض اليومية</p>
        <button class="btn">تسوق الآن</button>
      </div>
      <img class="hero-img" src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080&auto=format&fit=crop" alt="Hero" />
    </section>

    <section class="categories">
      <h2>التصنيفات</h2>
      <div class="cat-grid">
        <a class="cat" href="#">ملابس</a>
        <a class="cat" href="#">أحذية</a>
        <a class="cat" href="#">اكسسوارات</a>
        <a class="cat" href="#">أجهزة</a>
        <a class="cat" href="#">تخفيضات</a>
      </div>
    </section>

    <section class="products">
      <h2>الأكثر رواجًا</h2>
      <div class="prod-grid">
        <article class="prod">
          <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop" alt="p1" />
          <div class="info">
            <div class="title">منتج 1</div>
            <div class="price">89 ر.س</div>
          </div>
          <button class="btn btn-add">إضافة للسلة</button>
        </article>
        <article class="prod">
          <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop" alt="p2" />
          <div class="info">
            <div class="title">منتج 2</div>
            <div class="price">129 ر.س</div>
          </div>
          <button class="btn btn-add">إضافة للسلة</button>
        </article>
        <article class="prod">
          <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080&auto=format&fit=crop" alt="p3" />
          <div class="info">
            <div class="title">منتج 3</div>
            <div class="price">59 ر.س</div>
          </div>
          <button class="btn btn-add">إضافة للسلة</button>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.hero{display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px}
.hero-text{background:#0f172a;color:#fff;border-radius:12px;padding:16px}
.hero-text h1{margin:0 0 6px 0;font-size:20px}
.hero-text p{margin:0 0 10px 0;color:#cbd5e1}
.hero-img{width:100%;border-radius:12px;border:1px solid #e5e7eb}
.categories{margin-top:16px}
.categories h2,.products h2{font-size:16px;margin:0 0 10px 0}
.cat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.cat{display:grid;place-items:center;height:44px;border:1px solid #e5e7eb;border-radius:12px;color:#0f172a;text-decoration:none;background:#fff;font-size:13px}
.products{margin:16px 0}
.prod-grid{display:grid;grid-template-columns:1fr;gap:12px}
.prod{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
.prod img{width:100%;height:180px;object-fit:cover}
.prod .info{display:flex;justify-content:space-between;align-items:center;padding:10px 12px}
.prod .title{font-weight:600}
.prod .price{color:#0B5FFF;font-weight:700}
.btn-add{width:calc(100% - 24px);margin:0 12px 12px}
@media (min-width:420px){
  .prod-grid{grid-template-columns:1fr 1fr}
  .cat-grid{grid-template-columns:repeat(6,1fr)}
}
</style>

