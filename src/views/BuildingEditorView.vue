<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import MultiSelectTags from '../components/MultiSelectTags.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Map setup removed leaflet icon overrides

const route = useRoute()
const router = useRouter()
const isEditing = ref(route.name === 'building-edit')
const buildingId = route.params.id

const activeTab = ref('info')
const tabs = [
  { id: 'info', name: 'The building info' },
  { id: 'objects', name: 'The building Objects' },
  { id: 'map', name: 'Location on Map' },
  { id: 'photos', name: 'Photos' }
]

interface UnitForm {
  numberTitle: string;
  areaM2: number;
  price: number;
  status: string;
  rooms: number;
  currency: string;
  views: string[];
  floor: number | null;
  propertyType: string;
  photos: string[];
}

interface BlockForm {
  title: string;
  category: string;
  completionYear: number | string;
  completionQuarter: string;
  constructionStage: string;
  typeOfOwnership: string;
  leaseholdYears: string;
  units: UnitForm[];
}

interface PhotoAlbum {
  album_title: string;
  images: { url: string }[];
}

const form = ref({
  title: '',
  description: '',
  area: '',
  address: '',
  status: 'DRAFT',
  buildingClass: '',
  buildingMaterial: '',
  roadType: '',
  territory: '',
  hasView: false,
  hasPool: false,
  hasCarAccess: false,
  hasParking: false,
  pdfUrl: '',
  commission: '',
  telegram: '',
  advantages: [] as string[],
  documents: [] as { title: string; url: string }[],
  developer: '',
  whatsapp: '',
  mainImageUrl: '',
  stampImageUrl: '',
  stampPosition: 'top-right',
  lat: 0,
  lng: 0,
  contacts: [] as { email: string; name: string; phone: string; position: string }[],
  blocks: [] as BlockForm[],
  albums: [] as PhotoAlbum[]
})

const isLoading = ref(isEditing.value)
const isSaving = ref(false)

const map = ref<L.Map | null>(null)
// marker element removed in favor of fixed center pin
const searchQuery = ref('')
const isSearching = ref(false)
const isMapEditMode = ref(false)

const viewOptions = [
  'to the sunset',
  'to the sunrise',
  'to the ocean',
  'to the mountain',
  'to the pool',
  'to the garden',
  'no view'
]

const advantageOptions = [
  'Near Beach',
  'Close to Airport',
  'Security 24/7',
  'Private Pool',
  'Gym',
  'Parking',
  'City Center'
]

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
      if (map.value) {
        map.value.flyTo([form.value.lat, form.value.lng], 16, { duration: 1 })
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
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value as L.Map)

  if (!isMapEditMode.value) {
    map.value.dragging.disable()
    map.value.touchZoom.disable()
    map.value.doubleClickZoom.disable()
    map.value.scrollWheelZoom.disable()
  }

  map.value.on('moveend', () => {
    if (!isMapEditMode.value) return
    const center = map.value!.getCenter()
    form.value.lat = Number(center.lat.toFixed(6))
    form.value.lng = Number(center.lng.toFixed(6))
  })

  // Smooth centering on click
  map.value.on('click', (e: L.LeafletMouseEvent) => {
    if (!isMapEditMode.value) return
    map.value?.flyTo(e.latlng, map.value.getZoom(), { duration: 0.5 })
  })
}

watch(isMapEditMode, (isEdit) => {
  if (map.value) {
    if (isEdit) {
      map.value.dragging.enable()
      map.value.touchZoom.enable()
      map.value.doubleClickZoom.enable()
      map.value.scrollWheelZoom.enable()
    } else {
      map.value.dragging.disable()
      map.value.touchZoom.disable()
      map.value.doubleClickZoom.disable()
      map.value.scrollWheelZoom.disable()
      // ensure we recenter just in case
      map.value.setView([form.value.lat, form.value.lng], map.value.getZoom())
    }
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'map') {
    nextTick(() => {
      initMap()
      if (map.value) {
        map.value.invalidateSize()
        if (form.value.lat && form.value.lng) {
          map.value.setView([form.value.lat, form.value.lng], map.value.getZoom())
        }
      }
    })
  }
})

watch(() => [form.value.lat, form.value.lng], ([newLat, newLng]) => {
  if (map.value) {
    const current = map.value.getCenter()
    if (Math.abs(current.lat - Number(newLat)) > 0.0001 || Math.abs(current.lng - Number(newLng)) > 0.0001) {
       map.value.setView([Number(newLat), Number(newLng)], map.value.getZoom())
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
      completionQuarter: b.completion_quarter || 'I',
      constructionStage: b.construction_stage || 'Ready',
      typeOfOwnership: b.type_of_ownership || 'Free hold',
      leaseholdYears: b.total_years_of_leasehold || '',
      units: ((b.units && b.units.unit) || []).map((u: any) => ({
        numberTitle: u.numbertitle || u.numberTitle || '',
        areaM2: parseFloat(u.area_m2) || 0,
        price: parseFloat(u.price) || 0,
        status: u.status || 'Sale',
        rooms: u.number_of_rooms || 1,
        currency: u.currency || 'USD',
        views: Array.isArray(u.having_a_view) ? u.having_a_view : (typeof u.having_a_view === 'string' && u.having_a_view !== '' ? u.having_a_view.split(',').map((s: string) => s.trim()) : []),
        floor: u.floor ? parseInt(u.floor) : null,
        propertyType: u.type_of_unit || '',
        photos: u.photo ? [u.photo] : (Array.isArray(u.photos) ? u.photos : [])
      }))
    }))

    form.value = {
      title: data.title?.rendered || data.title || '',
      description: acf.description || '',
      area: acf.area || '',
      address: acf.address || '',
      status: data.status || 'PUBLISHED',
      buildingClass: acf.characteristics?.class_of_building || '',
      buildingMaterial: acf.characteristics?.building_material || '',
      roadType: acf.characteristics?.the_road_to_the_house || '',
      territory: acf.characteristics?.territory || '',
      hasView: acf.having_a_view || false,
      hasPool: acf.availability_of_a_swimming_pool || false,
      hasCarAccess: acf.car_access || false,
      hasParking: acf.private_parking || false,
      pdfUrl: acf.pdf_file || '',
      commission: acf.commission || '',
      telegram: acf.telegram || '',
      advantages: Array.isArray(acf.advantages) ? acf.advantages : [],
      documents: Array.isArray(acf.documents) ? acf.documents : [],
      developer: acf.developer || '',
      whatsapp: acf.whatsapp || '',
      mainImageUrl: acf.main_image || '',
      stampImageUrl: acf.stamp_image || '',
      stampPosition: acf.stamp_position || 'top-right',
      lat: data.coordinates && data.coordinates[0] ? data.coordinates[0].lat : 0,
      lng: data.coordinates && data.coordinates[0] ? data.coordinates[0].lng : 0,
      blocks,
      albums: (Array.isArray(acf.album) ? acf.album : []).map((a: any) => ({
        album_title: a.album_title || a.title_album || '',
        images: Array.isArray(a.images) ? a.images.map((url: string) => ({ url })) : []
      })),
      contacts: (Array.isArray(acf.contacts) ? acf.contacts : []).map((c: any) => ({
        email: c.email || '',
        name: c.name || '',
        phone: c.phone || '',
        position: c.position || ''
      }))
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
    const payload = {
      ...form.value,
      albums: form.value.albums.map(a => ({
        album_title: a.album_title,
        images: a.images.map(img => img.url).filter(url => url)
      }))
    }
    
    if (isEditing.value) {
      await api.put(`/buildings/${buildingId}`, payload)
      alert('Property saved successfully!')
    } else {
      const response = await api.post('/buildings', payload)
      router.push(`/admin/buildings/${response.data.id}`)
    }
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
    completionQuarter: 'I',
    constructionStage: 'Ready',
    typeOfOwnership: 'Free hold',
    leaseholdYears: '',
    units: []
  })
}

function removeBlock(index: number) {
  form.value.blocks.splice(index, 1)
}

function addAlbum() {
  form.value.albums.push({
    album_title: '',
    images: []
  })
}

function addContact() {
  form.value.contacts.push({
    email: '',
    name: '',
    phone: '',
    position: ''
  })
}

function removeContact(index: number) {
  form.value.contacts.splice(index, 1)
}

function removeAlbum(index: number) {
  form.value.albums.splice(index, 1)
}

function addPhotoToAlbum(albumIndex: number) {
  if (form.value.albums && form.value.albums[albumIndex] && form.value.albums[albumIndex].images) {
    form.value.albums[albumIndex].images.push({ url: '' })
  }
}

function removePhotoFromAlbum(albumIndex: number, photoIndex: number) {
  if (form.value.albums && form.value.albums[albumIndex] && form.value.albums[albumIndex].images) {
    form.value.albums[albumIndex].images.splice(photoIndex, 1)
  }
}

function getThumbnailUrl(url: string) {
  if (!url) return '';
  if (url.includes('-300x185') || url.includes('-150x150')) return url;
  return url.replace(/(\.png|\.jpg|\.jpeg|\.webp)$/i, '-300x185$1');
}

function handleImageError(event: Event, originalUrl: string) {
  const target = event.target as HTMLImageElement
  if (target && target.src !== originalUrl) {
    target.src = originalUrl
  } else if (target) {
    target.style.display = 'none'
  }
}

function showImage(event: Event) {
  const target = event.target as HTMLImageElement
  if (target) target.style.display = 'block'
}

function addUnit(blockIndex: number) {
  const block = form.value.blocks[blockIndex]
  if (block) {
    block.units.push({
      numberTitle: '',
      areaM2: 0,
      price: 0,
      status: 'Sale',
      rooms: 1,
      currency: 'USD',
      views: [],
      floor: null,
      propertyType: '',
      photos: []
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

                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">Commission</label>
                   <input type="text" v-model="form.commission" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">Telegram</label>
                   <input type="text" v-model="form.telegram" placeholder="https://t.me/..." class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                
                <div class="sm:col-span-6 border-t border-gray-200 mt-2 pt-6">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-sm font-medium text-gray-700">Contacts</h3>
                    <button @click="addContact" type="button" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Add Contact
                    </button>
                  </div>
                  
                  <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-300">
                      <thead class="bg-gray-50">
                        <tr>
                          <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Email</th>
                          <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Name</th>
                          <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Phone</th>
                          <th scope="col" class="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Position</th>
                          <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span class="sr-only">Remove</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 bg-white">
                        <tr v-for="(contact, index) in form.contacts" :key="index">
                          <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <input type="email" v-model="contact.email" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs" />
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm">
                            <input type="text" v-model="contact.name" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs" />
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm">
                            <input type="text" v-model="contact.phone" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs" />
                          </td>
                          <td class="whitespace-nowrap px-3 py-4 text-sm">
                            <input type="text" v-model="contact.position" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs" />
                          </td>
                          <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button @click="removeContact(index)" type="button" class="text-red-600 hover:text-red-900">Remove</button>
                          </td>
                        </tr>
                        <tr v-if="form.contacts.length === 0">
                          <td colspan="5" class="py-4 text-center text-sm text-gray-500">No contacts added yet.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="sm:col-span-6 border-t border-gray-200 mt-2 pt-6"></div>
                
                <div class="sm:col-span-6">
                   <MultiSelectTags 
                     v-model="form.advantages" 
                     :options="advantageOptions" 
                     label="Advantages" 
                     placeholder="Type or select advantages..." 
                   />
                </div>

                <div class="sm:col-span-6 border-t border-gray-200 mt-2 pt-6"></div>

                <!-- Toggles & Characteristics Area -->
                <div class="sm:col-span-3 grid grid-cols-2 gap-6">
                  <!-- Toggles -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Having a view</label>
                    <div class="flex items-center">
                      <input type="checkbox" v-model="form.hasView" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                      <span class="ml-2 text-sm text-gray-600">Yes</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Availability of a swimming pool</label>
                    <div class="flex items-center">
                      <input type="checkbox" v-model="form.hasPool" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                      <span class="ml-2 text-sm text-gray-600">Yes</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Car access</label>
                    <div class="flex items-center">
                      <input type="checkbox" v-model="form.hasCarAccess" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                      <span class="ml-2 text-sm text-gray-600">Yes</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Private parking</label>
                    <div class="flex items-center">
                      <input type="checkbox" v-model="form.hasParking" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                      <span class="ml-2 text-sm text-gray-600">Yes</span>
                    </div>
                  </div>
                </div>

                <div class="sm:col-span-3 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                   <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider">Characteristics</h4>
                   <div>
                     <label class="block text-xs font-medium text-gray-600">Class of building</label>
                     <select v-model="form.buildingClass" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                       <option value="Economy">Economy</option>
                       <option value="Comfort">Comfort</option>
                       <option value="Business">Business</option>
                       <option value="Premium">Premium</option>
                       <option value="Luxury">Luxury</option>
                     </select>
                   </div>
                   <div>
                     <label class="block text-xs font-medium text-gray-600">Building material</label>
                     <select v-model="form.buildingMaterial" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                       <option value="Monolith frame">Monolith frame</option>
                       <option value="Brick">Brick</option>
                       <option value="Wood">Wood</option>
                       <option value="Other">Other</option>
                     </select>
                   </div>
                   <div>
                     <label class="block text-xs font-medium text-gray-600">The road to the house</label>
                     <select v-model="form.roadType" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                       <option value="Asphalt">Asphalt</option>
                       <option value="Gravel">Gravel</option>
                       <option value="Dirt">Dirt</option>
                     </select>
                   </div>
                   <div>
                     <label class="block text-xs font-medium text-gray-600">Building area</label>
                     <select v-model="form.territory" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                       <option value="Private">Private</option>
                       <option value="Shared">Shared</option>
                     </select>
                   </div>
                </div>

                <div class="sm:col-span-6 border-t border-gray-200 mt-2 pt-6"></div>

                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">Documents / Extra Files (URL)</label>
                   <input v-if="form.documents.length === 0" type="text" @blur="if (($event.target as HTMLInputElement).value) { form.documents.push({ title: 'File', url: ($event.target as HTMLInputElement).value }); ($event.target as HTMLInputElement).value = ''; }" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://..." />
                   <div v-for="(doc, dIndex) in form.documents" :key="dIndex" class="mt-2 flex gap-2">
                     <input type="text" v-model="doc.url" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://..." />
                     <button @click="form.documents.splice(dIndex, 1)" class="text-red-500 hover:text-red-700 text-sm font-medium px-2">Remove</button>
                   </div>
                   <button v-if="form.documents.length > 0" @click="form.documents.push({ title: 'File', url: '' })" class="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add another document URL</button>
                </div>

                <div class="sm:col-span-3">
                   <label class="block text-sm font-medium text-gray-700">PDF File URL</label>
                   <input type="text" v-model="form.pdfUrl" placeholder="https://...pdf" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div class="sm:col-span-6 border-t border-gray-200 mt-2 pt-6"></div>

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
                     <div>
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Completion Quarter</label>
                        <select v-model="block.completionQuarter" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="I">I</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                        </select>
                     </div>
                     <div>
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Construction Stage</label>
                        <select v-model="block.constructionStage" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="Off-plan">Off-plan</option>
                          <option value="Under construction">Under construction</option>
                          <option value="Key handover">Key handover</option>
                          <option value="Ready">Ready</option>
                        </select>
                     </div>
                     <div>
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Type of Ownership</label>
                        <select v-model="block.typeOfOwnership" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="Lease hold">Lease hold</option>
                          <option value="Free hold">Free hold</option>
                          <option value="Hak pakai">Hak pakai</option>
                        </select>
                     </div>
                     <div v-show="block.typeOfOwnership === 'Lease hold'">
                        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Total years of leasehold</label>
                        <input type="text" v-model="block.leaseholdYears" class="mt-1 px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                     </div>
                   </div>

                   <!-- Unit Repeater inside Block -->
                   <div class="pl-4 border-l-2 border-indigo-200 space-y-3">
                      <h5 class="text-sm font-medium text-gray-700">Units in this Block</h5>
                      
                      <div v-for="(unit, uIndex) in block.units" :key="uIndex" class="bg-white border border-gray-200 p-4 rounded mb-4 relative grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">
                        <div class="absolute -top-3 -right-3 flex space-x-2">
                          <button @click="removeUnit(bIndex, uIndex)" class="text-red-500 hover:text-red-700 hover:bg-red-50 focus:outline-none bg-white border border-gray-200 shadow-sm rounded-full p-1.5 transition-colors" title="Remove Unit">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Number/Title</label>
                          <input type="text" v-model="unit.numberTitle" required class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Total unit area m2</label>
                          <input type="number" v-model="unit.areaM2" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Price</label>
                          <input type="number" v-model="unit.price" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                          <select v-model="unit.currency" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="USD">USD</option>
                            <option value="IDR">IDR</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                        
                        <div>
                          <MultiSelectTags 
                            v-model="unit.views" 
                            :options="viewOptions" 
                            label="Having a view" 
                            placeholder="Select or type views..." 
                          />
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Sale status</label>
                          <select v-model="unit.status" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="Sale">Sale</option>
                            <option value="Sold">Sold</option>
                            <option value="Reserved">Reserved</option>
                          </select>
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Number of bedrooms</label>
                          <input type="number" v-model="unit.rooms" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Floor</label>
                          <input type="number" v-model="unit.floor" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Type of unit</label>
                          <select v-model="unit.propertyType" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Villa">Villa</option>
                            <option value="Townhouse">Townhouse</option>
                            <option value="Commercial">Commercial</option>
                          </select>
                        </div>
                        
                        <div class="sm:col-span-2">
                          <label class="block text-xs font-medium text-gray-700 mb-1">Photo URLs (comma separated)</label>
                          <textarea :value="unit.photos.join(', ')" @input="unit.photos = ($event.target as HTMLTextAreaElement).value.split(',').map(s => s.trim())" rows="2" class="px-3 py-1.5 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
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
                <div class="flex items-center gap-4 mt-4 sm:mt-0">
                  <div class="text-xs text-slate-400 font-medium hidden sm:block">Click on map or drag marker to set coordinates</div>
                  <button type="button" @click="isMapEditMode = !isMapEditMode" :class="isMapEditMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'" class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                    <svg v-if="!isMapEditMode" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    {{ isMapEditMode ? 'Editing Mode ON' : 'Enable Edit Mode' }}
                  </button>
                </div>
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
                    :disabled="!isMapEditMode"
                    placeholder="Search for a location (e.g. Canggu, Bali)..." 
                    class="block w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all shadow-sm group-hover:border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button 
                    @click="searchLocation" 
                    class="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    :disabled="isSearching || !isMapEditMode"
                  >
                    {{ isSearching ? 'Finding...' : 'Search' }}
                  </button>
                </div>

                <!-- Map Container -->
                <div class="relative h-[500px] w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden z-0">
                  <div id="map-container" class="absolute inset-0 z-0"></div>
                  
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90%] pointer-events-none z-[1000] drop-shadow-xl flex flex-col items-center justify-center">
                    <div v-if="isMapEditMode" class="transition-opacity px-3 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg shadow-lg mb-1 whitespace-nowrap">
                      Drag map to select exactly
                    </div>
                    <svg class="h-10 w-10 text-rose-500 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                    </svg>
                    <div class="h-1.5 w-1.5 bg-rose-600 rounded-full absolute bottom-[5px] shadow-[0_0_8px_rgba(225,29,72,0.8)]"></div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Latitude</label>
                    <input 
                      type="number" 
                      v-model="form.lat" 
                      step="any" 
                      :disabled="!isMapEditMode"
                      class="block w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500" 
                    />
                  </div>
                  <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Longitude</label>
                    <input 
                      type="number" 
                      v-model="form.lng" 
                      step="any" 
                      :disabled="!isMapEditMode"
                      class="block w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500" 
                    />
                  </div>
                </div>
                
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">Current Location</h4>
                    <p class="text-[11px] text-slate-500 font-medium">Drag the map to position the pin exactly. Click anywhere to center the map quickly.</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-mono font-bold text-indigo-400 block uppercase">Coordinates</span>
                    <span class="text-xs font-mono font-bold text-indigo-600">{{ form.lat.toFixed(6) }}, {{ form.lng.toFixed(6) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Photos (Albums) -->
          <div v-show="activeTab === 'photos'" class="space-y-8">
            <div class="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
               <div class="flex justify-between items-center mb-6">
                 <h3 class="text-lg font-medium leading-6 text-gray-900">Photo Albums</h3>
               </div>

               <div class="space-y-8">
                 <div v-for="(album, aIndex) in form.albums" :key="aIndex" class="bg-gray-50 border border-gray-200 rounded-lg p-5 relative">
                   <button @click="removeAlbum(aIndex)" class="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">Remove Album</button>
                   
                   <div class="mb-6 max-w-sm">
                      <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Album Title</label>
                      <input type="text" v-model="album.album_title" class="mt-1 px-3 py-2 border block w-full rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-medium" placeholder="e.g. Exterior, Interior, Amenities">
                   </div>

                   <div class="space-y-4">
                      
                      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div v-for="(img, pIndex) in album.images" :key="pIndex" class="relative group aspect-square bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow transition-all">
                          <img v-if="img.url" :src="getThumbnailUrl(img.url)" alt="preview" class="w-full h-full object-cover absolute inset-0 z-0" @error="handleImageError($event, img.url)" @load="showImage" />
                          <div v-else class="w-full h-full flex flex-col justify-center items-center p-3 absolute inset-0 z-0">
                              <svg class="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span class="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider">No Image</span>
                          </div>
                          
                          <!-- Hover Overlay -->
                          <div :class="['absolute inset-0 z-10 bg-slate-900/70 p-3 flex flex-col justify-between transition-opacity duration-200', img.url ? 'opacity-0 group-hover:opacity-100' : 'opacity-100']">
                            <div class="relative">
                              <label class="block text-[9px] font-bold text-white/90 uppercase tracking-widest mb-1 shadow-sm">Image URL</label>
                              <input type="text" v-model="img.url" placeholder="https://..." class="block w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-md text-[11px] font-medium text-white placeholder-white/50 focus:bg-white focus:text-slate-900 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div class="flex justify-end mt-2">
                              <button @click="removePhotoFromAlbum(aIndex, pIndex)" class="bg-rose-500/90 hover:bg-rose-600 text-white p-1.5 rounded border border-rose-500/50 backdrop-blur-sm transition-colors shadow-sm" title="Remove Photo">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="pt-4 border-t border-slate-100">
                         <button @click="addPhotoToAlbum(aIndex)" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-4 py-2 mt-2 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm inline-flex items-center gap-2">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                           Add Photo to Gallery
                         </button>
                      </div>
                   </div>
                 </div>
               </div>

               <div class="mt-8 border-t border-gray-200 pt-6">
                  <button @click="addAlbum" class="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-medium text-gray-600 hover:text-indigo-600">
                    <span class="text-lg mr-2">+</span> Add a new Photo Album
                  </button>
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
