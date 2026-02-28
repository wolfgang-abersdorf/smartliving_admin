<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const route = useRoute()
const router = useRouter()
const isEditing = ref(route.name === 'building-edit')
const buildingId = route.params.id

const activeTab = ref('info')
const tabs = [
  { id: 'info', name: 'The building info' },
  { id: 'objects', name: 'The building Objects' },
  { id: 'map', name: 'Location on Map' }
]

interface UnitForm {
  numberTitle: string;
  areaM2: number;
  price: number;
  status: string;
  rooms: number;
}

interface BlockForm {
  title: string;
  category: string;
  completionYear: number;
  units: UnitForm[];
}

const form = ref({
  title: '',
  description: '',
  area: '',
  address: '',
  status: 'DRAFT',
  buildingClass: '',
  developer: '',
  whatsapp: '',
  mainImageUrl: '',
  stampImageUrl: '',
  stampPosition: 'top-right',
  lat: 0,
  lng: 0,
  blocks: [] as BlockForm[]
})

const isLoading = ref(isEditing.value)
const isSaving = ref(false)

const map = ref<L.Map | null>(null)
const marker = ref<L.Marker | null>(null)
const searchQuery = ref('')
const isSearching = ref(false)

async function searchLocation() {
  if (!searchQuery.value) return
  isSearching.value = true
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}`)
    const data = await response.json()
    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      form.value.lat = parseFloat(lat)
      form.value.lng = parseFloat(lon)
      if (map.value && marker.value) {
        const pos: L.LatLngExpression = [form.value.lat, form.value.lng]
        map.value.setView(pos, 16)
        marker.value.setLatLng(pos)
      }
    }
  } catch (error) {
    console.error('Search failed', error)
  } finally {
    isSearching.value = false
  }
}

function initMap() {
  if (map.value) return

  const initialLat = form.value.lat || -8.4095
  const initialLng = form.value.lng || 115.1889
  
  map.value = L.map('map-container').setView([initialLat, initialLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value)

  marker.value = L.marker([initialLat, initialLng], { draggable: true }).addTo(map.value)

  marker.value.on('dragend', () => {
    if (marker.value) {
      const position = marker.value.getLatLng()
      form.value.lat = position.lat
      form.value.lng = position.lng
    }
  })

  map.value.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    form.value.lat = lat
    form.value.lng = lng
    if (marker.value) {
      marker.value.setLatLng([lat, lng])
    }
  })
}

watch(activeTab, (newTab) => {
  if (newTab === 'map') {
    nextTick(() => {
      initMap()
      if (map.value) {
        map.value.invalidateSize()
        if (form.value.lat && form.value.lng) {
          const pos: L.LatLngExpression = [form.value.lat, form.value.lng]
          map.value.setView(pos)
          if (marker.value) marker.value.setLatLng(pos)
        }
      }
    })
  }
})

watch(() => [form.value.lat, form.value.lng], ([newLat, newLng]) => {
  if (marker.value && map.value) {
    const pos: L.LatLngExpression = [Number(newLat), Number(newLng)]
    if (!marker.value.getLatLng().equals(L.latLng(pos))) {
       marker.value.setLatLng(pos)
    }
  }
})

async function fetchBuilding() {
  if (!isEditing.value) return
  
  try {
    const response = await api.get(`/buildings/${buildingId}`)
    const data = response.data
    const acf = data.acf || {}

    // Map blocks from acf.block, each containing units.unit array
    const blocks: BlockForm[] = (acf.block || []).map((b: any) => ({
      title: b.title || '',
      category: b.category || 'Apartments',
      completionYear: b.completion_year || new Date().getFullYear(),
      units: ((b.units && b.units.unit) || []).map((u: any) => ({
        numberTitle: u.numbertitle || u.numberTitle || '',
        areaM2: parseFloat(u.area_m2) || 0,
        price: parseFloat(u.price) || 0,
        status: u.status || 'Sale',
        rooms: u.number_of_rooms || 1
      }))
    }))

    form.value = {
      title: data.title?.rendered || data.title || '',
      description: acf.description || '',
      area: acf.area || '',
      address: acf.address || '',
      status: data.status || 'PUBLISHED',
      buildingClass: acf.characteristics?.class_of_building || '',
      developer: acf.developer || '',
      whatsapp: acf.whatsapp || '',
      mainImageUrl: acf.main_image || '',
      stampImageUrl: acf.stamp_image || '',
      stampPosition: acf.stamp_position || 'top-right',
      lat: data.coordinates?.[0]?.lat || 0,
      lng: data.coordinates?.[0]?.lng || 0,
      blocks
    }
  } catch (error) {
    console.error('Failed to load building', error)
  } finally {
    isLoading.value = false
  }
}

async function saveBuilding() {
  isSaving.value = true
  try {
    if (isEditing.value) {
      await api.put(`/buildings/${buildingId}`, form.value)
    } else {
      await api.post('/buildings', form.value)
    }
    router.push('/admin/buildings')
  } catch (error) {
    console.error('Failed to save building', error)
    alert('Error saving building. Check console.')
  } finally {
    isSaving.value = false
  }
}

function addBlock() {
  form.value.blocks.push({
    title: '',
    category: 'Villas',
    completionYear: new Date().getFullYear(),
    units: []
  })
}

function removeBlock(index: number) {
  form.value.blocks.splice(index, 1)
}

function addUnit(blockIndex: number) {
  const block = form.value.blocks[blockIndex]
  if (block) {
    block.units.push({
      numberTitle: '',
      areaM2: 0,
      price: 0,
      status: 'Sale',
      rooms: 1
    })
  }
}

function removeUnit(blockIndex: number, unitIndex: number) {
  const block = form.value.blocks[blockIndex]
  if (block) {
    block.units.splice(unitIndex, 1)
  }
}

onMounted(() => {
  fetchBuilding()
})
</script>

<template>
  <div class="pb-16 max-w-7xl mx-auto">
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEditing ? 'Edit Property' : 'Add New Property' }}</h1>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-3">
        <button type="button" @click="router.back()" class="inline-flex bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 rounded-md shadow-sm hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" @click="saveBuilding" :disabled="isSaving" class="inline-flex bg-indigo-600 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50">
          {{ isSaving ? 'Saving...' : 'Save Property' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">
      Loading...
    </div>

    <div v-else class="lg:flex lg:items-start lg:gap-8">
      <!-- Main Column -->
      <div class="flex-1 space-y-8 min-w-0">
        <!-- Tabs Navigation -->
        <div class="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/60 inline-flex gap-1 mb-2 glass">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300',
              activeTab === tab.id 
                ? 'premium-gradient text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
            ]"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="transition-all duration-300">
          <!-- 1. The building info -->
          <div v-show="activeTab === 'info'" class="space-y-8">
            <div class="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Basic Information</h3>
              <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div class="sm:col-span-4">
                  <label class="block text-sm font-medium text-gray-700">Project Title</label>
                  <input type="text" v-model="form.title" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-gray-700">Status</label>
                  <select v-model="form.status" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>

                <div class="sm:col-span-6">
                  <label class="block text-sm font-medium text-gray-700">Description</label>
                  <textarea v-model="form.description" rows="3" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
                </div>
                
                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">Area</label>
                   <input type="text" v-model="form.area" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">Class</label>
                   <input type="text" v-model="form.buildingClass" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div class="sm:col-span-6">
                   <label class="block text-sm font-medium text-gray-700">Address</label>
                   <input type="text" v-model="form.address" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">Developer</label>
                   <input type="text" v-model="form.developer" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">WhatsApp URL</label>
                   <input type="text" v-model="form.whatsapp" placeholder="https://wa.me/..." class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div class="sm:col-span-6">
                   <label class="block text-sm font-medium text-gray-700">Main Image URL</label>
                   <input type="text" v-model="form.mainImageUrl" placeholder="https://..." class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                   <div v-if="form.mainImageUrl" class="mt-2">
                     <img :src="form.mainImageUrl" alt="Main image preview" class="w-48 h-32 object-cover rounded-md border border-gray-200" />
                   </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. The building Objects -->
          <div v-show="activeTab === 'objects'" class="space-y-8">
            <div class="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
               <div class="flex justify-between items-center mb-6">
                 <h3 class="text-lg font-medium leading-6 text-gray-900">Blocks & Units</h3>
               </div>

               <div class="space-y-6">
                 <!-- Block Repeater -->
                 <div v-for="(block, bIndex) in form.blocks" :key="bIndex" class="bg-gray-50 border border-gray-200 rounded-lg p-5 relative">
                   <button @click="removeBlock(bIndex)" class="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">Remove Block</button>
                   
                   <h4 class="text-md font-semibold text-gray-800 mb-4">Block {{ bIndex + 1 }}</h4>
                   <div class="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-3 mb-6">
                     <div>
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Block Title</label>
                        <input type="text" v-model="block.title" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Phase 1">
                     </div>
                     <div>
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                        <select v-model="block.category" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="Villas">Villas</option>
                          <option value="Apartments">Apartments</option>
                          <option value="Townhouses">Townhouses</option>
                        </select>
                     </div>
                     <div>
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Completion Year</label>
                        <input type="number" v-model="block.completionYear" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                     </div>
                   </div>

                   <!-- Unit Repeater inside Block -->
                   <div class="pl-4 border-l-2 border-indigo-200 space-y-3">
                      <h5 class="text-sm font-medium text-gray-700">Units in this Block</h5>
                      
                      <div v-for="(unit, uIndex) in block.units" :key="uIndex" class="bg-white border border-gray-200 p-3 rounded flex flex-wrap items-center gap-3">
                        <div class="w-full sm:w-auto flex-1">
                          <input type="text" v-model="unit.numberTitle" placeholder="Unit Name / Lot # *" required class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm">
                        </div>
                        <div class="w-24">
                          <input type="number" v-model="unit.areaM2" placeholder="m²" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm">
                        </div>
                        <div class="w-32">
                          <input type="number" v-model="unit.price" placeholder="Price" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm">
                        </div>
                        <div class="w-24">
                          <select v-model="unit.status" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm">
                            <option value="Sale">Sale</option>
                            <option value="Sold">Sold</option>
                            <option value="Reserved">Reserved</option>
                          </select>
                        </div>
                        <button @click="removeUnit(bIndex, uIndex)" class="text-red-500 hover:text-red-700 focus:outline-none" title="Remove Unit">
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <div class="pt-2">
                         <button @click="addUnit(bIndex)" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add Unit</button>
                      </div>
                   </div>
                 </div>
               </div>

               <div class="mt-6 border-t border-gray-200 pt-6">
                  <button @click="addBlock" class="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-600 hover:text-indigo-600">
                    <span class="text-lg mr-2">+</span> Add a new Block / Phase
                  </button>
               </div>
            </div>
          </div>

          <!-- 3. Location on Map -->
          <div v-show="activeTab === 'map'" class="space-y-8">
            <div class="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
              <div class="sm:flex sm:items-center sm:justify-between mb-6">
                <h3 class="text-lg font-medium leading-6 text-gray-900">Location on Map</h3>
                <div class="text-xs text-slate-400 font-medium">Click on map or drag marker to set coordinates</div>
              </div>

              <div class="grid grid-cols-1 gap-6">
                <!-- Search Bar -->
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    v-model="searchQuery" 
                    @keydown.enter.prevent="searchLocation"
                    placeholder="Search for a location (e.g. Canggu, Bali)..." 
                    class="block w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all shadow-sm group-hover:border-slate-200"
                  />
                  <button 
                    @click="searchLocation" 
                    class="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                    :disabled="isSearching"
                  >
                    {{ isSearching ? 'Finding...' : 'Search' }}
                  </button>
                </div>

                <!-- Map Container -->
                <div id="map-container" class="h-[500px] w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden z-0"></div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Latitude</label>
                    <input 
                      type="number" 
                      v-model.number="form.lat" 
                      step="any" 
                      class="block w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Longitude</label>
                    <input 
                      type="number" 
                      v-model.number="form.lng" 
                      step="any" 
                      class="block w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm" 
                    />
                  </div>
                </div>
                
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">Current Location</h4>
                    <p class="text-[11px] text-slate-500 font-medium">Double click anywhere to add a marker. Drag marker to move.</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-mono font-bold text-indigo-400 block uppercase">Coordinates</span>
                    <span class="text-xs font-mono font-bold text-indigo-600">{{ form.lat.toFixed(6) }}, {{ form.lng.toFixed(6) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> <!-- End Tab Content -->
      </div> <!-- End Main Column -->

      <!-- Sidebar -->
      <div class="lg:w-80 space-y-6 flex-shrink-0 mt-8 lg:mt-0">
        <!-- Publish / Status Widget -->
        <div class="bg-white shadow sm:rounded-2xl border border-white/60 overflow-hidden glass">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Publish</h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500 font-medium">Status:</span>
              <span class="font-bold text-indigo-600">{{ form.status }}</span>
            </div>
            <button @click="saveBuilding" :disabled="isSaving" class="w-full premium-gradient text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-xl transition-all active:scale-95">
              {{ isSaving ? 'Saving...' : 'Update Property' }}
            </button>
          </div>
        </div>

        <!-- Image Stamp Widget -->
        <div class="bg-white shadow sm:rounded-2xl border border-white/60 overflow-hidden glass">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Image Stamp</h3>
          </div>
          <div class="p-6">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Stamp Image URL</label>
            <div class="space-y-4">
              <div v-if="form.stampImageUrl" class="relative group">
                <img :src="form.stampImageUrl" alt="Stamp preview" class="w-full h-32 object-contain bg-slate-50 rounded-xl border border-slate-100 p-2" />
                <button @click="form.stampImageUrl = ''" class="absolute top-2 right-2 bg-white/80 backdrop-blur p-1 rounded-lg text-rose-500 hover:bg-rose-50 shadow-sm transition-colors opacity-0 group-hover:opacity-100">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div v-else class="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/30">
                 <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No stamp selected</p>
              </div>
              
              <input 
                type="text" 
                v-model="form.stampImageUrl" 
                placeholder="https://...png" 
                class="block w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />

              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Position</label>
                <select v-model="form.stampPosition" class="block w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none transition-all">
                  <option value="top-left">Top Left</option>
                  <option value="top_right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                </select>
              </div>

              <p class="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                PNG format with transparent background recommended. Suggested size: 500x500px.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
