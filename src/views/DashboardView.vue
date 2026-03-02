<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { 
  BuildingOfficeIcon, 
  FolderOpenIcon, 
  UsersIcon, 
  PlusIcon,
  QueueListIcon
} from '@heroicons/vue/24/outline'

const stats = ref({
  totalBuildings: 0,
  totalCollections: 0,
  totalUsers: 0
})
const isLoading = ref(true)

async function fetchDashboardStats() {
  try {
    const buildingsRes = await api.get('/buildings?per_page=1')
    const collectionsRes = await api.get('/collections')
    const usersRes = await api.get('/users')

    stats.value = {
      totalBuildings: buildingsRes.data.total || 0,
      totalCollections: collectionsRes.data.length || 0,
      totalUsers: usersRes.data.length || 0
    }
  } catch (error) {
    console.error('Failed to load dashboard stats', error)
  } finally {
    isLoading.value = false
  }
}

const quickActions = [
  { name: 'Add New Property', href: '/admin/buildings/new', icon: PlusIcon, color: 'bg-indigo-500' },
  { name: 'Browse Properties', href: '/admin/buildings', icon: BuildingOfficeIcon, color: 'bg-purple-500' },
  { name: 'Collections List', href: '/admin/collections', icon: QueueListIcon, color: 'bg-rose-500' },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon, color: 'bg-amber-500' },
]

onMounted(fetchDashboardStats)
</script>

<template>
  <div>
    <div class="mb-10">
      <h1 class="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
      <p class="text-slate-500 mt-1 font-medium">Real-time statistics of your platform.</p>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
       <div v-for="i in 3" :key="i" class="h-40 glass animate-pulse rounded-3xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Total Buildings Card -->
      <div class="group relative overflow-hidden glass rounded-[2rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1">
        <div class="absolute -top-6 -right-6 h-32 w-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-1">Properties</p>
            <h3 class="text-4xl font-black text-slate-800">{{ stats.totalBuildings }}</h3>
          </div>
          <div class="h-16 w-16 bg-white rounded-2xl shadow-premium flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
             <BuildingOfficeIcon class="h-8 w-8" />
          </div>
        </div>
        <div class="mt-6 flex items-center text-xs font-bold text-indigo-400">
           <span class="px-2 py-1 bg-indigo-50 rounded-lg mr-2">+ 12%</span>
           <span>from last month</span>
        </div>
      </div>

      <!-- Total Collections Card -->
      <div class="group relative overflow-hidden glass rounded-[2rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-1">
        <div class="absolute -top-6 -right-6 h-32 w-32 bg-purple-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-purple-500 uppercase tracking-widest mb-1">Collections</p>
            <h3 class="text-4xl font-black text-slate-800">{{ stats.totalCollections }}</h3>
          </div>
          <div class="h-16 w-16 bg-white rounded-2xl shadow-premium flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
             <FolderOpenIcon class="h-8 w-8" />
          </div>
        </div>
        <div class="mt-6 flex items-center text-xs font-bold text-purple-400">
           <span class="px-2 py-1 bg-purple-50 rounded-lg mr-2">+ 5</span>
           <span>new requests</span>
        </div>
      </div>

      <!-- Total Users Card -->
      <div class="group relative overflow-hidden glass rounded-[2rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-100 hover:-translate-y-1">
        <div class="absolute -top-6 -right-6 h-32 w-32 bg-rose-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-sm font-bold text-rose-500 uppercase tracking-widest mb-1">Agents</p>
            <h3 class="text-4xl font-black text-slate-800">{{ stats.totalUsers }}</h3>
          </div>
          <div class="h-16 w-16 bg-white rounded-2xl shadow-premium flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
             <UsersIcon class="h-8 w-8" />
          </div>
        </div>
        <div class="mt-6 flex items-center text-xs font-bold text-rose-400">
           <span class="px-2 py-1 bg-rose-50 rounded-lg mr-2">Active</span>
           <span>platform users</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions Section -->
    <div class="mt-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-black text-slate-800 tracking-tight">Quick Actions</h2>
        <div class="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
      </div>
      
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <router-link
          v-for="action in quickActions"
          :key="action.name"
          :to="action.href"
          class="group flex flex-col items-center justify-center p-8 glass rounded-[2.5rem] transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 border border-white/60"
        >
          <div :class="[action.color, 'h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform mb-4']">
            <component :is="action.icon" class="h-8 w-8" />
          </div>
          <span class="text-sm font-bold text-slate-700">{{ action.name }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
