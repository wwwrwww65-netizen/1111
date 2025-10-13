<template>
  <div class="min-h-screen" dir="rtl">
    <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b flex items-center justify-center z-50">
      <h1 class="text-lg font-semibold">اختر موقعك</h1>
      <button class="absolute left-3" @click="goBack">✕</button>
    </header>
    <main class="pt-12">
      <div id="map" class="w-full h-[70vh]"></div>
      <div class="p-3 space-y-2 bg-white border-t">
        <div class="text-sm text-gray-700">{{ addressLine || '—' }}</div>
        <div class="flex gap-2">
          <button class="flex-1 border px-3 py-2" @click="locateMe">موقعي الحالي</button>
          <button class="flex-1 bg-[#8a1538] text-white px-3 py-2" :disabled="!selection" @click="confirm">تأكيد</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function goBack(){ router.back() }

// Sana'a, Yemen
const defaultCenter = { lat: 15.3694, lng: 44.1910 }
const mapEl = ref<any>(null)
let map: any = null
let marker: any = null
const selection = ref<{lat:number,lng:number}|null>(null)
const addressLine = ref('')
let geocoder: any = null

function loadGoogle(): Promise<void>{
  return new Promise((resolve, reject)=>{
    if ((window as any).google?.maps){ resolve(); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places&language=ar`
    s.async = true
    s.onload = ()=> resolve()
    s.onerror = ()=> reject(new Error('gmaps load failed'))
    document.head.appendChild(s)
  })
}

function setSelection(pos: {lat:number,lng:number}){
  selection.value = { lat: pos.lat, lng: pos.lng }
  if (!marker){ marker = new (window as any).google.maps.Marker({ position: pos, map: map!, draggable: true })
    marker.addListener('dragend', ()=>{ const p = marker!.getPosition()!; setSelection({ lat: p.lat(), lng: p.lng() }) })
  } else { marker.setPosition(pos) }
  reverseGeocode(pos)
}

function reverseGeocode(pos: {lat:number,lng:number}){
  if (!geocoder) geocoder = new (window as any).google.maps.Geocoder()
  geocoder.geocode({ location: pos }, (results: any[], status: string)=>{
    if (status === 'OK' && results && results[0]){
      addressLine.value = results[0].formatted_address || ''
      const comps = results[0].address_components || []
      const byType = (t:string)=> comps.find((c:any)=> (c.types||[]).includes(t))
      const countryC = byType('country')
      const stateC = byType('administrative_area_level_1') || byType('administrative_area_level_2')
      const cityC = byType('locality') || byType('sublocality') || byType('administrative_area_level_2')
      const routeC = byType('route')
      // persist structured snapshot for Address page to consume
      const snapshot = {
        lat: pos.lat,
        lng: pos.lng,
        addressLine: addressLine.value,
        country: countryC?.long_name || 'اليمن',
        countryCode: countryC?.short_name || 'YE',
        state: stateC?.long_name || 'صنعاء',
        city: cityC?.long_name || 'صنعاء',
        street: routeC?.long_name || (addressLine.value.split(',')[0] || '')
      }
      sessionStorage.setItem('gmaps_selection_latest', JSON.stringify(snapshot))
    } else { addressLine.value = '' }
  })
}

function locateMe(){
  if (!navigator.geolocation){ return }
  navigator.geolocation.getCurrentPosition((res)=>{
    const pos = { lat: res.coords.latitude, lng: res.coords.longitude }
    map!.setCenter(pos)
    map!.setZoom(15)
    setSelection(pos)
  })
}

function confirm(){
  if (!selection.value) return
  // Persist in session and navigate back to Address
  const snapshot = sessionStorage.getItem('gmaps_selection_latest')
  const payload = snapshot ? JSON.parse(snapshot) : { ...selection.value, addressLine: addressLine.value }
  sessionStorage.setItem('gmaps_selection', JSON.stringify(payload))
  router.push('/address')
}

onMounted(async ()=>{
  await loadGoogle()
  map = new (window as any).google.maps.Map(document.getElementById('map') as HTMLElement, { center: defaultCenter, zoom: 13, disableDefaultUI: false })
  map.addListener('click', (e: any)=>{
    if (e.latLng){ setSelection({ lat: e.latLng.lat(), lng: e.latLng.lng() }) }
  })
  setSelection(defaultCenter)
})
</script>
