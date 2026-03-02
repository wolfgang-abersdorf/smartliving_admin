<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { 
  FolderIcon, 
  UserIcon, 
  CalendarIcon, 
  SparklesIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

interface Collection {
  id: number
  title: { rendered: string } | string
  authorName?: string
  createdAt: string
  buildingsCount: number
}

const collections = ref<Collection[]>([])
const isLoading = ref(true)
const error = ref('')

async function fetchCollections() {
  try {
    const response = await api.get('/collections')
    collections.value = response.data
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Failed to load collections'
    console.error('Failed to load collections', err)
  } finally {
    isLoading.value = false
  }
}

function getTitle(col: Collection): string {
  if (typeof col.title === 'string') return col.title
  return (col.title as any)?.rendered || 'Untitled'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

async function deleteCollection(id: number) {
  if (!confirm('Are you sure you want to delete this collection?')) return
  try {
    await api.delete(`/collections/${id}`)
    collections.value = collections.value.filter(c => c.id !== id)
  } catch (err: any) {
    alert('Failed to delete collection')
  }
}

onMounted(fetchCollections)
</script>

<template>
  <div class="pb-12">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 tracking-tight">Collections</h1>
        <p class="text-slate-500 mt-1 font-medium">Curated property lists for your clients.</p>
      </div>
      <router-link
        to="/admin/collections/new"
        class="inline-flex items-center premium-gradient text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        New Collection
      </router-link>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
       <div v-for="i in 6" :key="i" class="h-48 glass rounded-[2rem] animate-pulse"></div>
    </div>

    <div v-else-if="error" class="p-10 glass rounded-[2rem] text-center text-rose-500 font-bold italic">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="col in collections" :key="col.id" 
           class="group glass rounded-[2.5rem] p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-white/60 hover:-translate-y-2 relative overflow-hidden">
        
        <div class="absolute -top-10 -right-10 h-24 w-24 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500"></div>

        <div class="relative">
          <div class="flex items-center justify-between mb-6">
            <div class="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
              <FolderIcon class="h-6 w-6" />
            </div>
            <div class="flex items-center gap-2">
               <span class="px-3 py-1 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest">
                 ID: {{ col.id }}
               </span>
            </div>
          </div>

          <h3 class="text-lg font-bold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {{ getTitle(col) }}
          </h3>

          <div class="space-y-3 mb-8">
            <div class="flex items-center text-sm font-medium text-slate-500">
              <UserIcon class="h-4 w-4 mr-2 text-slate-300" />
              {{ col.authorName || '—' }}
            </div>
            <div class="flex items-center text-sm font-medium text-slate-500">
              <SparklesIcon class="h-4 w-4 mr-2 text-indigo-300" />
              {{ col.buildingsCount }} Properties
            </div>
            <div class="flex items-center text-sm font-medium text-slate-400">
              <CalendarIcon class="h-4 w-4 mr-2 text-slate-300" />
              {{ formatDate(col.createdAt) }}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <router-link 
              :to="`/admin/collections/${col.id}`"
              class="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 py-3 rounded-2xl text-xs font-bold text-center transition-colors border border-transparent hover:border-indigo-100"
            >
              Edit Details
            </router-link>
            <button 
              @click="deleteCollection(col.id)"
              class="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="collections.length === 0" class="col-span-full py-20 text-center glass rounded-[2.5rem]">
        <FolderIcon class="h-16 w-16 mx-auto text-slate-200 mb-4" />
        <p class="text-slate-400 font-bold">No collections found.</p>
      </div>
    </div>
  </div>
</template>
