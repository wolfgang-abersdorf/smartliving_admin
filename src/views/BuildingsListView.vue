<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

const buildings = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

async function fetchBuildings() {
  isLoading.value = true
  try {
    const response = await api.get(`/buildings?per_page=10&page=${currentPage.value}`)
    buildings.value = response.data.items
    totalPages.value = response.data.pages || 1
  } catch (error) {
    console.error('Failed to load buildings', error)
  } finally {
    isLoading.value = false
  }
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchBuildings()
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'publish':
    case 'published':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'draft':
      return 'bg-amber-50 text-amber-600 border-amber-100'
    case 'private':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-slate-50 text-slate-500 border-slate-100'
  }
}

onMounted(fetchBuildings)
</script>

<template>
  <div class="pb-12">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 tracking-tight">Properties</h1>
        <p class="text-slate-500 mt-1 font-medium">Manage and monitor all building objects.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative group">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search properties..." 
            class="pl-11 pr-6 py-3 glass rounded-2xl w-full md:w-80 text-sm font-medium focus:ring-2 focus:ring-indigo-200 outline-none border-white/60 transition-all"
          />
        </div>
        <router-link
          to="/admin/buildings/new"
          class="inline-flex items-center premium-gradient text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          Add Property
        </router-link>
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
       <div v-for="i in 6" :key="i" class="h-24 glass rounded-[1.5rem] animate-pulse"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div v-for="building in buildings" :key="building.id" 
           class="group glass rounded-[2rem] p-5 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-white/60 hover:-translate-y-1">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center flex-1 min-w-0">
            <div class="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0 overflow-hidden group-hover:scale-110 transition-transform">
              <img v-if="building.acf?.main_image" :src="building.acf.main_image" loading="lazy" class="w-full h-full object-cover" alt="Property preview" />
              <BuildingOfficeIcon v-else class="h-8 w-8" />
            </div>
            <div class="ml-5 truncate">
              <h3 class="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                {{ building.title?.rendered || building.title }}
              </h3>
              <div class="flex items-center mt-1 text-sm font-medium text-slate-400">
                <MapPinIcon class="h-4 w-4 mr-1" />
                {{ building.acf?.area || 'Location not specified' }}
                <span class="mx-2 text-slate-200">•</span>
                <span class="text-slate-500 font-bold capitalize">{{ building.acf?.characteristics?.class_of_building || 'Standard' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div :class="[getStatusColor(building.status), 'px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border']">
              {{ building.status || 'Published' }}
            </div>
            <div class="h-10 w-1px bg-slate-100 hidden sm:block"></div>
            <div class="flex items-center gap-2">
              <router-link 
                :to="`/admin/buildings/${building.id}`"
                class="h-12 w-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-90"
              >
                <ChevronRightIcon class="h-6 w-6" />
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-if="buildings.length === 0" class="col-span-full py-20 text-center glass rounded-[2rem]">
        <BuildingOfficeIcon class="h-16 w-16 mx-auto text-slate-200 mb-4" />
        <p class="text-slate-400 font-bold">No properties found.</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-3">
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="h-10 w-10 flex items-center justify-center rounded-xl glass text-slate-500 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/60 shadow-sm"
      >
        <ChevronLeftIcon class="h-5 w-5" />
      </button>
      
      <div class="glass px-6 py-2.5 rounded-xl border border-white/60 shadow-sm text-sm font-bold text-slate-600">
        Page {{ currentPage }} of {{ totalPages }}
      </div>

      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="h-10 w-10 flex items-center justify-center rounded-xl glass text-slate-500 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/60 shadow-sm"
      >
        <ChevronRightIcon class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
