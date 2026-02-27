<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const stats = ref([
  { name: 'Total Buildings', stat: '...', icon: 'OfficeBuildingIcon' },
  { name: 'Total Collections', stat: '...', icon: 'FolderOpenIcon' },
  { name: 'Platform Users', stat: '...', icon: 'UsersIcon' }
])

const isLoading = ref(true)

async function fetchDashboardStats() {
  try {
    const [buildingsRes, collectionsRes] = await Promise.all([
      api.get('/buildings?limit=1'),
      api.get('/collections')
    ])
    
    stats.value[0]!.stat = buildingsRes.data.pagination.totalItems.toString()
    stats.value[1]!.stat = collectionsRes.data.length.toString()
    stats.value[2]!.stat = '1+' // Mocked until we implement the users endpoint
    
  } catch (error) {
    console.error('Failed to load dashboard stats', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">SmartLiving Dashboard</h1>
    
    <div>
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div v-for="item in stats" :key="item.name" class="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6 border border-gray-100">
          <dt class="text-sm font-medium text-gray-500 truncate">
            {{ item.name }}
          </dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">
            {{ isLoading ? '...' : item.stat }}
          </dd>
        </div>
      </dl>
    </div>
    
    <div class="mt-8 bg-white shadow rounded-lg p-6 border border-gray-100">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <router-link to="/admin/buildings" class="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
          <svg class="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-600" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span class="mt-2 block text-sm font-medium text-gray-900">
            Manage Properties
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>
