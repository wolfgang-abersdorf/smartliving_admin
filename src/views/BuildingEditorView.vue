<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const isEditing = ref(route.name === 'building-edit')
const buildingId = route.params.id

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
  blocks: [] as BlockForm[]
})

const isLoading = ref(isEditing.value)
const isSaving = ref(false)

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
  <div class="pb-16 max-w-5xl mx-auto">
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

    <div v-else class="space-y-8">
      <!-- Basic Info Section -->
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
             <input type="text" v-model="form.area" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          
          <div class="sm:col-span-3">
             <label class="block text-sm font-medium text-gray-700">Class</label>
             <input type="text" v-model="form.buildingClass" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div class="sm:col-span-6">
             <label class="block text-sm font-medium text-gray-700">Address</label>
             <input type="text" v-model="form.address" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div class="sm:col-span-3">
             <label class="block text-sm font-medium text-gray-700">Developer</label>
             <input type="text" v-model="form.developer" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div class="sm:col-span-3">
             <label class="block text-sm font-medium text-gray-700">WhatsApp URL</label>
             <input type="text" v-model="form.whatsapp" placeholder="https://wa.me/..." class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div class="sm:col-span-6">
             <label class="block text-sm font-medium text-gray-700">Main Image URL</label>
             <input type="text" v-model="form.mainImageUrl" placeholder="https://..." class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
             <div v-if="form.mainImageUrl" class="mt-2">
               <img :src="form.mainImageUrl" alt="Main image preview" class="w-48 h-32 object-cover rounded-md border border-gray-200" />
             </div>
          </div>
        </div>
      </div>
      
      <!-- Blocks & Units Section -->
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
                  <input type="text" v-model="block.title" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="e.g. Phase 1">
               </div>
               <div>
                  <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                  <select v-model="block.category" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option value="Villas">Villas</option>
                    <option value="Apartments">Apartments</option>
                    <option value="Townhouses">Townhouses</option>
                  </select>
               </div>
               <div>
                  <label class="block text-xs font-medium text-gray-500 uppercase tracking-wide">Completion Year</label>
                  <input type="number" v-model="block.completionYear" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
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
  </div>
</template>
