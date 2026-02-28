<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const isEditing = ref(route.name === 'collection-edit')
const collectionId = route.params.id

const form = ref({
  title: '',
  objects: '',
  buildings_ids: [] as number[]
})

const allBuildings = ref<any[]>([])
const searchQuery = ref('')
const isLoading = ref(true)
const isSaving = ref(false)

const filteredBuildings = computed(() => {
  if (!searchQuery.value) return allBuildings.value
  const q = searchQuery.value.toLowerCase()
  return allBuildings.value.filter(b => 
    (b.title?.rendered || b.title || '').toLowerCase().includes(q) ||
    (b.acf?.area || '').toLowerCase().includes(q)
  )
})

async function fetchBuildings() {
  try {
    const response = await api.get('/buildings?per_page=100')
    allBuildings.value = response.data.items || []
  } catch (error) {
    console.error('Failed to load buildings', error)
  }
}

async function fetchCollection() {
  if (!isEditing.value) return
  
  try {
    const response = await api.get(`/collections/${collectionId}`)
    const data = response.data
    form.value = {
      title: data.title?.rendered || data.title || '',
      objects: data.acf?.objects || data.objects || '',
      buildings_ids: (data.acf?.buildings_ids || []).map((b: any) => typeof b === 'object' ? b.id : b)
    }
  } catch (error) {
    console.error('Failed to load collection', error)
  }
}

async function saveCollection() {
  isSaving.value = true
  try {
    const payload = {
      title: form.value.title,
      objects: form.value.objects,
      buildings_ids: form.value.buildings_ids
    }

    if (isEditing.value) {
      await api.put(`/collections/${collectionId}`, payload)
    } else {
      await api.post('/collections', payload)
    }
    router.push('/admin/collections')
  } catch (error) {
    console.error('Failed to save collection', error)
    alert('Error saving collection. Check console.')
  } finally {
    isSaving.value = false
  }
}

function toggleBuilding(id: number) {
  const index = form.value.buildings_ids.indexOf(id)
  if (index === -1) {
    form.value.buildings_ids.push(id)
  } else {
    form.value.buildings_ids.splice(index, 1)
  }
}

onMounted(async () => {
  try {
    await fetchBuildings()
    if (isEditing.value) {
      await fetchCollection()
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="pb-16 max-w-5xl mx-auto">
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEditing ? 'Edit Collection' : 'Add New Collection' }}</h1>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-3">
        <button type="button" @click="router.back()" class="inline-flex bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 rounded-md shadow-sm hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" @click="saveCollection" :disabled="isSaving" class="inline-flex bg-indigo-600 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50">
          {{ isSaving ? 'Saving...' : 'Save Collection' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">
      Loading...
    </div>

    <div v-else class="space-y-8">
      <!-- Basic Info Section -->
      <div class="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Collection Details</h3>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-6">
            <label class="block text-sm font-medium text-gray-700">Collection Title</label>
            <input type="text" v-model="form.title" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="e.g. My Favorite Villas" />
          </div>

          <div class="sm:col-span-6">
            <label class="block text-sm font-medium text-gray-700">Objects Meta (JSON/Text)</label>
            <textarea v-model="form.objects" rows="5" class="mt-1 px-3 py-2 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='[{"idComplex":7546,...}]'></textarea>
          </div>
        </div>
      </div>

      <!-- Buildings Selection Section -->
      <div class="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Select Buildings</h3>
          <div class="w-64">
             <input type="text" v-model="searchQuery" placeholder="Search buildings..." class="px-3 py-1.5 border block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>
        
        <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-md scrollbar-thin">
          <ul class="divide-y divide-gray-200">
            <li v-for="building in filteredBuildings" :key="building.id" 
                class="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                @click="toggleBuilding(building.id)">
              <div class="flex h-5 items-center">
                <input type="checkbox" 
                       :checked="form.buildings_ids.includes(building.id)"
                       class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </div>
              <div class="ml-3 text-sm">
                <label class="font-medium text-gray-700">{{ building.title?.rendered || building.title }}</label>
                <p class="text-gray-500">{{ building.acf?.area || 'No Area' }}</p>
              </div>
            </li>
            <li v-if="filteredBuildings.length === 0" class="px-4 py-8 text-center text-gray-500">
              No buildings found matching your search.
            </li>
          </ul>
        </div>
        <p class="mt-2 text-sm text-gray-500">Selected: {{ form.buildings_ids.length }} buildings</p>
      </div>
    </div>
  </div>
</template>
