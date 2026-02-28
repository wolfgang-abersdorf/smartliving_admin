<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const buildings = ref<any[]>([])
const isLoading = ref(true)

async function fetchBuildings() {
  try {
    const response = await api.get('/buildings?limit=50')
    buildings.value = response.data.items || []
  } catch (error) {
    console.error('Failed to load buildings', error)
  } finally {
    isLoading.value = false
  }
}

function getStatusColor(status: string) {
  if (status === 'PUBLISHED') return 'bg-green-100 text-green-800'
  if (status === 'DRAFT') return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <div>
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900">Properties (Buildings)</h1>
        <p class="mt-2 text-sm text-gray-700">A list of all the buildings including their title, status, and area.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <router-link to="/admin/buildings/new" class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
          Add property
        </router-link>
      </div>
    </div>
    
    <div class="mt-8 flex flex-col">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Area</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Class</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                
                <tr v-if="isLoading">
                  <td colspan="5" class="py-10 text-center text-sm text-gray-500">
                    Loading properties...
                  </td>
                </tr>

                <tr v-else-if="buildings.length === 0">
                  <td colspan="5" class="py-10 text-center text-sm text-gray-500">
                    No properties found.
                  </td>
                </tr>

                <tr v-else v-for="building in buildings" :key="building.id">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ building.title?.rendered || building.title }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ building.acf?.area || 'N/A' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                     {{ building.acf?.characteristics?.class_of_building || 'N/A' }}
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <router-link :to="`/admin/buildings/${building.id}`" class="text-indigo-600 hover:text-indigo-900">Edit<span class="sr-only">, {{ building.title?.rendered || building.title }}</span></router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
